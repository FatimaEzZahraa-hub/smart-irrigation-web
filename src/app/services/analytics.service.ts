import { Injectable } from '@angular/core';

import { Sensor } from '../models/sensor';
import { JournalPompe } from '../models/pump';

export type AnalyticsPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

export interface PumpSession {
  start: Date;
  end: Date;
  durationMs: number;
  trigger?: 'manuel' | 'automatique';
}

export interface ConsumptionStats {
  dailyLiters: number;
  weeklyLiters: number;
  monthlyLiters: number;
  totalIrrigationMs: number;
  averageHumidity: number;
  averageTemperature: number;
}

export interface ChartPoint {
  label: string;
  value: number;
}

export interface AnalyticsSnapshot {
  stats: ConsumptionStats;
  humiditySeries: ChartPoint[];
  waterSeries: ChartPoint[];
  pumpTimeSeries: ChartPoint[];
  pumpSessions: PumpSession[];
}

const DEFAULT_FLOW_RATE_L_PER_MIN = 20;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  buildSnapshot(
    sensors: Sensor[],
    pumpHistory: JournalPompe[],
    periodStart: Date,
    periodEnd: Date,
    flowRate = DEFAULT_FLOW_RATE_L_PER_MIN
  ): AnalyticsSnapshot {
    const sessions = this.computePumpSessions(pumpHistory, periodEnd);
    const now = periodEnd;

    const dailyStart = this.startOfDay(now);
    const weeklyStart = this.addDays(this.startOfDay(now), -6);
    const monthlyStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dailySessions = sessions.filter((s) => s.end >= dailyStart);
    const weeklySessions = sessions.filter((s) => s.end >= weeklyStart);
    const monthlySessions = sessions.filter((s) => s.end >= monthlyStart);
    const periodSessions = sessions.filter((s) => s.end >= periodStart && s.start <= periodEnd);

    const periodSensors = sensors.filter((s) => {
      const date = new Date(s.enregistre_le);
      return date >= periodStart && date <= periodEnd;
    });

    return {
      stats: {
        dailyLiters: this.litersFromSessions(dailySessions, flowRate),
        weeklyLiters: this.litersFromSessions(weeklySessions, flowRate),
        monthlyLiters: this.litersFromSessions(monthlySessions, flowRate),
        totalIrrigationMs: periodSessions.reduce((sum, s) => sum + s.durationMs, 0),
        averageHumidity: this.averageHumidity(periodSensors),
        averageTemperature: this.averageTemperature(periodSensors)
      },
      humiditySeries: this.buildHumiditySeries(periodSensors, periodStart, periodEnd),
      waterSeries: this.buildWaterSeries(periodSessions, periodStart, periodEnd, flowRate),
      pumpTimeSeries: this.buildPumpTimeSeries(periodSessions, periodStart, periodEnd),
      pumpSessions: periodSessions
    };
  }

  getPeriodDates(period: Exclude<AnalyticsPeriod, 'custom'>, reference = new Date()): { start: Date; end: Date } {
    const end = new Date(reference);
    end.setHours(23, 59, 59, 999);
    const start = this.startOfDay(reference);

    if (period === 'today') {
      return { start, end };
    }

    if (period === 'week') {
      const weekStart = this.addDays(start, -6);
      return { start: weekStart, end };
    }

    if (period === 'month') {
      start.setDate(1);
      return { start, end };
    }

    if (period === 'quarter') {
      const quarterMonth = Math.floor(reference.getMonth() / 3) * 3;
      return {
        start: new Date(reference.getFullYear(), quarterMonth, 1),
        end
      };
    }

    start.setMonth(0, 1);
    return { start, end };
  }

  formatDuration(ms: number): string {
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }

    return `${minutes}min`;
  }

  formatLiters(value: number): string {
    return `${Math.round(value)} L`;
  }

  toInputDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  sessionLiters(durationMs: number, flowRate = DEFAULT_FLOW_RATE_L_PER_MIN): number {
    return (durationMs / 60000) * flowRate;
  }

  private computePumpSessions(history: JournalPompe[], capEnd: Date): PumpSession[] {
    const sorted = [...history]
      .map((entry) => ({ entry, date: this.getPumpDate(entry) }))
      .filter(({ date }) => !Number.isNaN(date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    const sessions: PumpSession[] = [];
    let activeStart: Date | null = null;
    let activeTrigger: 'manuel' | 'automatique' | undefined;

    for (const { entry, date } of sorted) {
      if (entry.action === 'ON') {
        activeStart = date;
        activeTrigger = entry.declenche_par;
        continue;
      }

      if (entry.action === 'OFF' && activeStart) {
        sessions.push({
          start: activeStart,
          end: date,
          durationMs: Math.max(0, date.getTime() - activeStart.getTime()),
          trigger: activeTrigger
        });
        activeStart = null;
        activeTrigger = undefined;
      }
    }

    if (activeStart) {
      sessions.push({
        start: activeStart,
        end: capEnd,
        durationMs: Math.max(0, capEnd.getTime() - activeStart.getTime()),
        trigger: activeTrigger
      });
    }

    return sessions;
  }

  private litersFromSessions(sessions: PumpSession[], flowRate: number): number {
    const totalMinutes = sessions.reduce((sum, session) => sum + session.durationMs / 60000, 0);
    return totalMinutes * flowRate;
  }

  private buildHumiditySeries(sensors: Sensor[], start: Date, end: Date): ChartPoint[] {
    const buckets = this.createTimeBuckets(start, end, sensors.length > 48 ? 'day' : 'hour');
    const grouped = new Map<string, number[]>();

    for (const sensor of sensors) {
      const date = new Date(sensor.enregistre_le);
      const key = this.bucketKey(date, buckets.mode);
      const humidity = Number(sensor.humidite_sol ?? sensor.metric_value ?? 0);
      const values = grouped.get(key) ?? [];
      values.push(humidity);
      grouped.set(key, values);
    }

    return buckets.labels.map((label, index) => {
      const key = buckets.keys[index];
      const values = grouped.get(key) ?? [];
      const average = values.length
        ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
        : 0;
      return { label, value: average };
    });
  }

  private buildWaterSeries(
    sessions: PumpSession[],
    start: Date,
    end: Date,
    flowRate: number
  ): ChartPoint[] {
    const buckets = this.createTimeBuckets(start, end, 'day');

    return buckets.labels.map((label, index) => {
      const bucketStart = buckets.starts[index];
      const bucketEnd = buckets.ends[index];
      const bucketSessions = sessions.filter(
        (session) => session.end >= bucketStart && session.start <= bucketEnd
      );
      const minutes = bucketSessions.reduce((sum, session) => {
        const overlapStart = Math.max(session.start.getTime(), bucketStart.getTime());
        const overlapEnd = Math.min(session.end.getTime(), bucketEnd.getTime());
        return sum + Math.max(0, overlapEnd - overlapStart) / 60000;
      }, 0);

      return { label, value: Math.round(minutes * flowRate) };
    });
  }

  private buildPumpTimeSeries(sessions: PumpSession[], start: Date, end: Date): ChartPoint[] {
    const buckets = this.createTimeBuckets(start, end, 'day');

    return buckets.labels.map((label, index) => {
      const bucketStart = buckets.starts[index];
      const bucketEnd = buckets.ends[index];
      const bucketSessions = sessions.filter(
        (session) => session.end >= bucketStart && session.start <= bucketEnd
      );
      const minutes = bucketSessions.reduce((sum, session) => {
        const overlapStart = Math.max(session.start.getTime(), bucketStart.getTime());
        const overlapEnd = Math.min(session.end.getTime(), bucketEnd.getTime());
        return sum + Math.max(0, overlapEnd - overlapStart) / 60000;
      }, 0);

      return { label, value: Math.round(minutes) };
    });
  }

  private createTimeBuckets(start: Date, end: Date, mode: 'hour' | 'day') {
    const labels: string[] = [];
    const keys: string[] = [];
    const starts: Date[] = [];
    const ends: Date[] = [];
    const cursor = new Date(start);

    if (mode === 'hour') {
      cursor.setMinutes(0, 0, 0);
      while (cursor <= end) {
        const bucketStart = new Date(cursor);
        const bucketEnd = new Date(cursor);
        bucketEnd.setHours(bucketEnd.getHours() + 1, 0, 0, -1);
        labels.push(bucketStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        keys.push(this.bucketKey(bucketStart, 'hour'));
        starts.push(bucketStart);
        ends.push(bucketEnd);
        cursor.setHours(cursor.getHours() + 1);
      }
      return { labels, keys, starts, ends, mode };
    }

    cursor.setHours(0, 0, 0, 0);
    while (cursor <= end) {
      const bucketStart = new Date(cursor);
      const bucketEnd = new Date(cursor);
      bucketEnd.setHours(23, 59, 59, 999);
      labels.push(bucketStart.toLocaleDateString([], { weekday: 'short', day: 'numeric' }));
      keys.push(this.bucketKey(bucketStart, 'day'));
      starts.push(bucketStart);
      ends.push(bucketEnd);
      cursor.setDate(cursor.getDate() + 1);
    }

    return { labels, keys, starts, ends, mode };
  }

  private bucketKey(date: Date, mode: 'hour' | 'day'): string {
    if (mode === 'hour') {
      return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    }

    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private averageHumidity(sensors: Sensor[]): number {
    if (!sensors.length) {
      return 0;
    }

    const total = sensors.reduce(
      (sum, sensor) => sum + Number(sensor.humidite_sol ?? sensor.metric_value ?? 0),
      0
    );
    return Math.round(total / sensors.length);
  }

  private averageTemperature(sensors: Sensor[]): number {
    if (!sensors.length) {
      return 0;
    }

    const total = sensors.reduce((sum, sensor) => sum + Number(sensor.temperature ?? 0), 0);
    return Math.round((total / sensors.length) * 10) / 10;
  }

  private getPumpDate(entry: JournalPompe): Date {
    return new Date(entry.declenche_le || 0);
  }

  private startOfDay(date: Date): Date {
    const copy = new Date(date);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  private addDays(date: Date, days: number): Date {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }
}
