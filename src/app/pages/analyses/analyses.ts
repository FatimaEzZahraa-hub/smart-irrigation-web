import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';

import { DeviceService } from '../../services/device.service';
import { SensorService } from '../../services/sensor.service';
import { PumpService } from '../../services/pump.service';
import { ZoneStateService } from '../../services/zone-state.service';
import {
  AnalyticsPeriod,
  AnalyticsService,
  AnalyticsSnapshot,
  PumpSession
} from '../../services/analytics.service';
import { Sensor } from '../../models/sensor';
import { JournalPompe } from '../../models/pump';

@Component({
  selector: 'app-analyses',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './analyses.html',
  styleUrl: './analyses.css'
})
export class Analyses implements AfterViewInit, OnDestroy {
  @ViewChild('humidityCanvas') private humidityCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('waterCanvas') private waterCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pumpCanvas') private pumpCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('cumulativeWaterCanvas') private cumulativeWaterCanvas?: ElementRef<HTMLCanvasElement>;

  selectedZoneId = '';
  selectedPeriod: AnalyticsPeriod = 'today';
  startDate = '';
  endDate = '';
  isLoading = false;
  errorMessage = '';
  snapshot: AnalyticsSnapshot | null = null;
  periodStart = new Date();
  periodEnd = new Date();

  readonly periods: AnalyticsPeriod[] = ['today', 'week', 'month', 'quarter', 'year', 'custom'];

  private humidityChart?: Chart;
  private waterChart?: Chart;
  private pumpChart?: Chart;
  private cumulativeWaterChart?: Chart;
  private viewReady = false;

  constructor(
    private deviceService: DeviceService,
    private sensorService: SensorService,
    private pumpService: PumpService,
    private analyticsService: AnalyticsService,
    private translate: TranslateService,
    private zoneState: ZoneStateService
  ) {
    this.setPeriod('today', false);
    this.loadZones();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  get stats() {
    return this.snapshot?.stats;
  }

  get hasData(): boolean {
    return !!this.snapshot && (
      this.snapshot.stats.totalIrrigationMs > 0
      || this.snapshot.humiditySeries.some((point) => point.value > 0)
      || this.snapshot.waterSeries.some((point) => point.value > 0)
    );
  }

  get pumpSessions(): PumpSession[] {
    return this.snapshot?.pumpSessions ?? [];
  }

  get totalPeriodLiters(): number {
    return (this.snapshot?.waterSeries ?? []).reduce((sum, p) => sum + p.value, 0);
  }

  setPeriod(period: AnalyticsPeriod, reload = true): void {
    this.selectedPeriod = period;

    if (period !== 'custom') {
      const { start, end } = this.analyticsService.getPeriodDates(period);
      this.startDate = this.analyticsService.toInputDate(start);
      this.endDate = this.analyticsService.toInputDate(end);
    }

    if (reload) {
      this.loadData();
    }
  }

  onCustomDateChange(): void {
    this.selectedPeriod = 'custom';
    this.loadData();
  }

  getPeriodLabel(period: AnalyticsPeriod): string {
    return `ANALYSES.PERIOD.${period.toUpperCase()}`;
  }

  formatDuration(ms: number): string {
    return this.analyticsService.formatDuration(ms);
  }

  formatLiters(value: number): string {
    return this.analyticsService.formatLiters(value);
  }

  exportPdf(): void {
    if (!this.snapshot) {
      return;
    }

    const stats = this.snapshot.stats;
    const printWindow = window.open('', '_blank', 'width=1024,height=720');

    if (!printWindow) {
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${this.escapeHtml(this.translate.instant('ANALYSES.EXPORT_TITLE'))}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #0f172a; margin: 32px; }
            h1 { font-size: 22px; margin: 0 0 6px; }
            p { color: #64748b; margin: 0 0 24px; }
            .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
            .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
            .label { color: #64748b; font-size: 12px; margin-bottom: 6px; }
            .value { font-size: 24px; font-weight: 700; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 12px; }
            th { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>${this.escapeHtml(this.translate.instant('ANALYSES.EXPORT_TITLE'))}</h1>
          <p>${this.escapeHtml(this.startDate)} - ${this.escapeHtml(this.endDate)}</p>
          <div class="grid">
            <div class="card"><div class="label">${this.escapeHtml(this.translate.instant('ANALYSES.DAILY_WATER'))}</div><div class="value">${this.formatLiters(stats.dailyLiters)}</div></div>
            <div class="card"><div class="label">${this.escapeHtml(this.translate.instant('ANALYSES.WEEKLY_WATER'))}</div><div class="value">${this.formatLiters(stats.weeklyLiters)}</div></div>
            <div class="card"><div class="label">${this.escapeHtml(this.translate.instant('ANALYSES.MONTHLY_WATER'))}</div><div class="value">${this.formatLiters(stats.monthlyLiters)}</div></div>
            <div class="card"><div class="label">${this.escapeHtml(this.translate.instant('ANALYSES.TOTAL_IRRIGATION'))}</div><div class="value">${this.formatDuration(stats.totalIrrigationMs)}</div></div>
          </div>
          <h2>${this.escapeHtml(this.translate.instant('ANALYSES.WATER_CHART'))}</h2>
          <table>
            <thead><tr><th>${this.escapeHtml(this.translate.instant('ANALYSES.DATE'))}</th><th>${this.escapeHtml(this.translate.instant('ANALYSES.LITERS'))}</th></tr></thead>
            <tbody>${this.snapshot.waterSeries.map((row) => `<tr><td>${this.escapeHtml(row.label)}</td><td>${row.value} L</td></tr>`).join('')}</tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  exportStatistics(): void {
    if (!this.snapshot) {
      return;
    }

    const stats = this.snapshot.stats;
    const headers = [
      this.translate.instant('ANALYSES.METRIC'),
      this.translate.instant('ANALYSES.VALUE')
    ];
    const rows = [
      [this.translate.instant('ANALYSES.DAILY_WATER'), this.formatLiters(stats.dailyLiters)],
      [this.translate.instant('ANALYSES.WEEKLY_WATER'), this.formatLiters(stats.weeklyLiters)],
      [this.translate.instant('ANALYSES.MONTHLY_WATER'), this.formatLiters(stats.monthlyLiters)],
      [this.translate.instant('ANALYSES.TOTAL_IRRIGATION'), this.formatDuration(stats.totalIrrigationMs)],
      [this.translate.instant('ANALYSES.AVG_HUMIDITY'), `${stats.averageHumidity}%`],
      [this.translate.instant('ANALYSES.AVG_TEMPERATURE'), `${stats.averageTemperature} C`]
    ];

    const waterRows = this.snapshot.waterSeries.map((point) => [
      `${this.translate.instant('ANALYSES.WATER_CHART')} - ${point.label}`,
      `${point.value} L`
    ]);
    const humidityRows = this.snapshot.humiditySeries.map((point) => [
      `${this.translate.instant('ANALYSES.HUMIDITY_CHART')} - ${point.label}`,
      `${point.value}%`
    ]);
    const pumpRows = this.snapshot.pumpTimeSeries.map((point) => [
      `${this.translate.instant('ANALYSES.PUMP_CHART')} - ${point.label}`,
      `${point.value} min`
    ]);

    const csvRows = [
      headers,
      ...rows,
      [],
      [this.translate.instant('ANALYSES.DETAILS')],
      ...waterRows,
      ...humidityRows,
      ...pumpRows
    ];

    const csv = csvRows.map((row) => row.map((value) => this.escapeCsvValue(value)).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `analyses-irrigation-${this.analyticsService.toInputDate(new Date())}.csv`);
  }

  private loadZones(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.deviceService.getDevices()
      .pipe(
        timeout(12000),
        catchError(() => of([])),
        finalize(() => {
          if (!this.selectedZoneId) {
            this.isLoading = false;
            this.buildEmptySnapshot();
          }
        })
      )
      .subscribe({
        next: (zones) => {
          const saved = this.zoneState.selectedZoneId;
          const match = saved && zones.some((z) => String(z.id) === saved);
          this.selectedZoneId = match ? saved : (zones.length ? String(zones[0].id) : '');
          if (this.selectedZoneId) {
            this.loadData();
          }
        },
        error: () => {
          this.errorMessage = 'ANALYSES.ERROR';
          this.isLoading = false;
        }
      });
  }

  private loadData(): void {
    if (!this.selectedZoneId) {
      this.buildEmptySnapshot();
      return;
    }

    const periodStart = new Date(`${this.startDate}T00:00:00`);
    const periodEnd = new Date(`${this.endDate}T23:59:59`);
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;

    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      sensors: this.sensorService.getHistory(this.selectedZoneId, {
        startDate: this.startDate,
        endDate: this.endDate,
        type: 'all'
      }).pipe(catchError(() => of([] as Sensor[]))),
      pumps: this.pumpService.history(this.selectedZoneId).pipe(catchError(() => of([])))
    })
      .pipe(
        timeout(15000),
        catchError(() => of({ sensors: [] as Sensor[], pumps: [] })),
        finalize(() => this.isLoading = false)
      )
      .subscribe(({ sensors, pumps }) => {
        const pumpHistory = Array.isArray(pumps) ? pumps as JournalPompe[] : [];
        this.snapshot = this.analyticsService.buildSnapshot(
          sensors,
          pumpHistory,
          periodStart,
          periodEnd
        );
        this.renderCharts();
      });
  }

  private buildEmptySnapshot(): void {
    const periodStart = new Date(`${this.startDate}T00:00:00`);
    const periodEnd = new Date(`${this.endDate}T23:59:59`);
    this.periodStart = periodStart;
    this.periodEnd = periodEnd;
    this.snapshot = this.analyticsService.buildSnapshot([], [], periodStart, periodEnd);
    this.renderCharts();
  }

  private renderCharts(): void {
    if (!this.viewReady || !this.snapshot) {
      return;
    }

    this.destroyCharts();

    const cumulativeSeries = this.buildCumulativeWaterSeries();

    if (this.humidityCanvas) {
      this.humidityChart = new Chart(this.humidityCanvas.nativeElement, this.buildLineConfig(
        this.snapshot.humiditySeries,
        this.translate.instant('ANALYSES.HUMIDITY_AXIS'),
        '#2f6b4f'
      ));
    }

    if (this.waterCanvas) {
      this.waterChart = new Chart(this.waterCanvas.nativeElement, this.buildBarConfig(
        this.snapshot.waterSeries,
        this.translate.instant('ANALYSES.LITERS'),
        '#0284c7'
      ));
    }

    if (this.pumpCanvas) {
      this.pumpChart = new Chart(this.pumpCanvas.nativeElement, this.buildBarConfig(
        this.snapshot.pumpTimeSeries,
        this.translate.instant('ANALYSES.MINUTES'),
        '#0d9488'
      ));
    }

    if (this.cumulativeWaterCanvas) {
      this.cumulativeWaterChart = new Chart(
        this.cumulativeWaterCanvas.nativeElement,
        this.buildLineConfig(
          cumulativeSeries,
          this.translate.instant('ANALYSES.CUMUL_LITERS'),
          '#0284c7'
        )
      );
    }
  }

  private buildLineConfig(
    series: { label: string; value: number }[],
    yLabel: string,
    color: string
  ): ChartConfiguration<'line'> {
    return {
      type: 'line',
      data: {
        labels: series.map((point) => point.label),
        datasets: [{
          label: yLabel,
          data: series.map((point) => point.value),
          borderColor: color,
          backgroundColor: `${color}22`,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: this.baseChartOptions(yLabel) as ChartConfiguration<'line'>['options']
    };
  }

  private buildBarConfig(
    series: { label: string; value: number }[],
    yLabel: string,
    color: string
  ): ChartConfiguration<'bar'> {
    return {
      type: 'bar',
      data: {
        labels: series.map((point) => point.label),
        datasets: [{
          label: yLabel,
          data: series.map((point) => point.value),
          backgroundColor: `${color}cc`,
          borderRadius: 6,
          maxBarThickness: 42
        }]
      },
      options: this.baseChartOptions(yLabel) as ChartConfiguration<'bar'>['options']
    };
  }

  private baseChartOptions(yLabel: string) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 }
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: yLabel,
            color: '#64748b',
            font: { size: 11, weight: 'bold' as const }
          },
          grid: { color: '#f1f5f9' },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 }
          }
        }
      }
    };
  }

  private destroyCharts(): void {
    this.humidityChart?.destroy();
    this.waterChart?.destroy();
    this.pumpChart?.destroy();
    this.cumulativeWaterChart?.destroy();
    this.humidityChart = undefined;
    this.waterChart = undefined;
    this.pumpChart = undefined;
    this.cumulativeWaterChart = undefined;
  }

  sessionLeft(session: PumpSession): string {
    const total = this.periodEnd.getTime() - this.periodStart.getTime();
    if (total <= 0) return '0%';
    const offset = Math.max(0, session.start.getTime() - this.periodStart.getTime());
    return `${(offset / total * 100).toFixed(2)}%`;
  }

  sessionWidth(session: PumpSession): string {
    const total = this.periodEnd.getTime() - this.periodStart.getTime();
    if (total <= 0) return '1%';
    const clampedStart = Math.max(session.start.getTime(), this.periodStart.getTime());
    const clampedEnd = Math.min(session.end.getTime(), this.periodEnd.getTime());
    const durationMs = Math.max(0, clampedEnd - clampedStart);
    return `${Math.max(0.2, durationMs / total * 100).toFixed(2)}%`;
  }

  sessionTriggerKey(session: PumpSession): string {
    if (session.trigger === 'automatique') return 'ANALYSES.TRIGGER_AUTO';
    if (session.trigger === 'manuel') return 'ANALYSES.TRIGGER_MANUAL';
    return '';
  }

  formatDateTime(date: Date): string {
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  sessionLiters(session: PumpSession): string {
    return this.analyticsService.formatLiters(
      this.analyticsService.sessionLiters(session.durationMs)
    );
  }

  private buildCumulativeWaterSeries() {
    let sum = 0;
    return (this.snapshot?.waterSeries ?? []).map(p => {
      sum += p.value;
      return { label: p.label, value: Math.round(sum) };
    });
  }

  private escapeCsvValue(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
