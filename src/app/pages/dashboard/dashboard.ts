import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { Chart, ChartConfiguration } from 'chart.js/auto';
import { Subscription } from 'rxjs';

import { SensorService } from '../../services/sensor.service';
import { WeatherService, ZoneWeather } from '../../services/weather.service';
import { DeviceService, DeviceSettings } from '../../services/device.service';
import { PumpService } from '../../services/pump.service';
import { ZoneStateService } from '../../services/zone-state.service';
import { AlertStateService, IrrigationAlert } from '../../services/alert-state.service';
import { Sensor } from '../../models/sensor';
import { AiRecommendationCard } from '../../components/ai-recommendation-card/ai-recommendation-card';

const SEVERITY_COLORS: Record<IrrigationAlert['severity'], string> = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#0284c7'
};

const SEVERITY_ORDER: Record<IrrigationAlert['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
    AiRecommendationCard
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('soilHistoryCanvas') private soilHistoryCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('alertsSeverityCanvas') private alertsSeverityCanvas?: ElementRef<HTMLCanvasElement>;

  soilHumidity = 0;
  temperature = 0;
  airHumidity = 0;
  pumpStatus: 'ON' | 'OFF' = 'OFF';
  deviceMode: 'manual' | 'auto' = 'manual';
  selectedZoneId = '';
  selectedZoneName = '';
  zonesError = '';
  weather?: ZoneWeather;
  weatherLoading = false;
  weatherError = '';
  lastSensorUpdate?: Date;
  deviceSettings?: DeviceSettings;
  soilHistory: Sensor[] = [];
  alerts: IrrigationAlert[] = [];
  lastPumpAction?: Date;

  private soilHistoryChart?: Chart;
  private alertsSeverityChart?: Chart;
  private viewReady = false;
  private alertsSub?: Subscription;

  constructor(
    private sensorService: SensorService,
    private deviceService: DeviceService,
    private pumpService: PumpService,
    public weatherService: WeatherService,
    private zoneState: ZoneStateService,
    private alertState: AlertStateService
  ) {}

  ngOnInit(): void {
    this.loadUserZones();

    this.alertsSub = this.alertState.alerts$.subscribe((alerts) => {
      this.alerts = alerts;
      this.renderCharts();
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.alertsSub?.unsubscribe();
    this.destroyCharts();
  }

  get soilStatusKey(): string {
    if (this.soilHumidity < 35) {
      return 'DASHBOARD.SOIL.DRY';
    }
    if (this.soilHumidity > 75) {
      return 'DASHBOARD.SOIL.WET';
    }
    return 'DASHBOARD.SOIL.OPTIMAL';
  }

  get soilStatusClass(): string {
    if (this.soilHumidity < 35) {
      return 'dry';
    }
    if (this.soilHumidity > 75) {
      return 'wet';
    }
    return 'optimal';
  }

  get pumpModeKey(): string {
    return this.deviceMode === 'auto'
      ? 'DASHBOARD.AUTO_MODE_ACTIVE'
      : 'DASHBOARD.MANUAL_MODE_ACTIVE';
  }

  get weatherTone(): string {
    const description = this.weather?.description?.toLowerCase() || '';
    const icon = this.weather?.icon || '';

    if (description.includes('rain') || icon.includes('09') || icon.includes('10')) {
      return 'rain';
    }
    if (description.includes('cloud') || icon.includes('03') || icon.includes('04')) {
      return 'cloud';
    }
    return 'sun';
  }

  get selectedZoneLabel(): string {
    return this.weather?.location || this.selectedZoneName;
  }

  get irrigationModeKey(): string {
    return this.deviceMode === 'auto' ? 'PUMP.AUTOMATIC' : 'PUMP.MANUAL';
  }

  get growthStageKey(): string {
    const plantingDate = this.deviceSettings?.plantingDate;

    if (!plantingDate) {
      return 'DASHBOARD.SUMMARY.STAGE_UNKNOWN';
    }

    const days = Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86400000);

    if (!Number.isFinite(days) || days < 0) {
      return 'DASHBOARD.SUMMARY.STAGE_UNKNOWN';
    }
    if (days < 14) {
      return 'DASHBOARD.SUMMARY.STAGE_GERMINATION';
    }
    if (days < 45) {
      return 'DASHBOARD.SUMMARY.STAGE_VEGETATIVE';
    }
    if (days < 75) {
      return 'DASHBOARD.SUMMARY.STAGE_FLOWERING';
    }
    return 'DASHBOARD.SUMMARY.STAGE_MATURITY';
  }

  get unresolvedAlerts(): IrrigationAlert[] {
    return this.alerts.filter((alert) => !alert.resolved);
  }

  get mostSevereAlert(): IrrigationAlert | undefined {
    return [...this.unresolvedAlerts].sort(
      (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
    )[0];
  }

  get cropHealthKey(): string {
    const topAlert = this.mostSevereAlert;

    if (!topAlert) {
      return 'DASHBOARD.SUMMARY.HEALTH_GOOD';
    }
    return topAlert.severity === 'critical'
      ? 'DASHBOARD.SUMMARY.HEALTH_CRITICAL'
      : 'DASHBOARD.SUMMARY.HEALTH_ATTENTION';
  }

  get cropHealthClass(): string {
    const topAlert = this.mostSevereAlert;

    if (!topAlert) {
      return 'good';
    }
    return topAlert.severity === 'critical' ? 'critical' : 'attention';
  }

  get dashboardHeadlineKey(): string {
    switch (this.cropHealthClass) {
      case 'critical':
        return 'DASHBOARD.HEADLINE_CRITICAL';
      case 'attention':
        return 'DASHBOARD.HEADLINE_ATTENTION';
      default:
        return 'DASHBOARD.HEADLINE_GOOD';
    }
  }

  get aiRecommendationKey(): string {
    return this.mostSevereAlert?.recommendationKey ?? 'DASHBOARD.SUMMARY.AI_RECOMMENDATION_OK';
  }

  get nextIrrigationKey(): string {
    if (this.pumpStatus === 'ON') {
      return 'DASHBOARD.SUMMARY.IRRIGATING_NOW';
    }
    if (this.deviceMode !== 'auto') {
      return 'DASHBOARD.SUMMARY.MANUAL_MODE_HINT';
    }

    const threshold = this.deviceSettings?.humidityThreshold ?? 40;

    return this.soilHumidity >= threshold
      ? 'DASHBOARD.SUMMARY.NO_IRRIGATION_REQUIRED'
      : 'DASHBOARD.SUMMARY.IRRIGATION_PENDING';
  }

  get nextIrrigationClass(): string {
    if (this.pumpStatus === 'ON') {
      return 'active';
    }
    if (this.deviceMode !== 'auto') {
      return 'neutral';
    }

    const threshold = this.deviceSettings?.humidityThreshold ?? 40;

    return this.soilHumidity >= threshold ? 'good' : 'pending';
  }

  loadZoneData(zoneId: string): void {
    this.sensorService.getLatest(zoneId).subscribe({
      next: (res: any) => {
        this.soilHumidity = res.humidite_sol;
        this.temperature = res.temperature;
        this.airHumidity = res.humidite_air;
        this.lastSensorUpdate = res.enregistre_le ? new Date(res.enregistre_le) : undefined;
      },
      error: () => {}
    });

    this.pumpService.history(zoneId).subscribe({
      next: (logs: any) => {
        const history = Array.isArray(logs) ? logs : [];
        const latest = history[0];
        this.pumpStatus = latest && latest.action === 'ON' ? 'ON' : 'OFF';
        this.lastPumpAction = latest?.declenche_le ? new Date(latest.declenche_le) : undefined;
      },
      error: () => {
        this.pumpStatus = 'OFF';
        this.lastPumpAction = undefined;
      }
    });

    this.deviceService.getSettings(zoneId).subscribe({
      next: (settings) => {
        this.deviceSettings = settings;
      },
      error: () => {}
    });

    this.sensorService.getHistory(zoneId, { type: 'soil' }).subscribe({
      next: (rows) => {
        this.soilHistory = [...rows].slice(0, 12).reverse();
        this.renderCharts();
      },
      error: () => {
        this.soilHistory = [];
      }
    });

    this.loadWeather(zoneId);
  }

  loadWeather(zoneId: string): void {
    this.weatherLoading = true;
    this.weatherError = '';

    this.weatherService.getZoneWeather(zoneId).subscribe({
      next: (weather) => {
        this.weather = weather;
        this.weatherLoading = false;
      },
      error: (err) => {
        this.weatherError = this.getWeatherErrorMessage(err);
        this.weatherLoading = false;
      }
    });
  }

  private getWeatherErrorMessage(err: any): string {
    if (err?.status === 0) {
      return 'DASHBOARD.WEATHER.ERROR_NETWORK';
    }
    if (err?.status === 401 || err?.status === 403) {
      return 'DASHBOARD.WEATHER.ERROR_TOKEN';
    }
    if (err?.status === 400) {
      return 'DASHBOARD.WEATHER.ERROR_COORDINATES';
    }
    return 'DASHBOARD.WEATHER.ERROR_UNAVAILABLE';
  }

  private loadUserZones(): void {
    this.deviceService.getDevices().subscribe({
      next: (zones) => {
        if (zones.length > 0) {
          const firstZone = zones[0];
          this.selectedZoneId = String(firstZone.id);
          this.selectedZoneName = this.getZoneName(firstZone);
          this.deviceMode = firstZone.mode === 'auto' ? 'auto' : 'manual';
          this.zoneState.setZone(this.selectedZoneId);
          this.loadZoneData(this.selectedZoneId);
        }
      },
      error: () => {
        this.zonesError = 'DASHBOARD.ERROR_ZONES';
      }
    });
  }

  private getZoneName(zone?: { nom?: string; emplacement?: string }): string {
    return zone?.nom || zone?.emplacement || '';
  }

  private renderCharts(): void {
    if (!this.viewReady) {
      return;
    }

    this.destroyCharts();

    if (this.soilHistoryCanvas) {
      this.soilHistoryChart = new Chart(this.soilHistoryCanvas.nativeElement, this.buildSoilHistoryConfig());
    }

    if (this.alertsSeverityCanvas) {
      this.alertsSeverityChart = new Chart(this.alertsSeverityCanvas.nativeElement, this.buildAlertsSeverityConfig());
    }
  }

  private buildSoilHistoryConfig(): ChartConfiguration<'line'> {
    const labels = this.soilHistory.map((row) =>
      new Date(row.enregistre_le).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const values = this.soilHistory.map((row) => row.humidite_sol ?? row.metric_value ?? 0);

    return {
      type: 'line',
      data: {
        labels,
        datasets: [{
          data: values,
          borderColor: '#2f6b4f',
          backgroundColor: '#2f6b4f22',
          fill: true,
          tension: 0.35,
          pointRadius: 2,
          pointHoverRadius: 4
        }]
      },
      options: this.compactChartOptions() as ChartConfiguration<'line'>['options']
    };
  }

  private buildAlertsSeverityConfig(): ChartConfiguration<'bar'> {
    const severities: IrrigationAlert['severity'][] = ['critical', 'warning', 'info'];
    const counts = severities.map(
      (severity) => this.alerts.filter((alert) => alert.severity === severity).length
    );

    return {
      type: 'bar',
      data: {
        labels: ['Critical', 'Warning', 'Info'],
        datasets: [{
          data: counts,
          backgroundColor: severities.map((severity) => SEVERITY_COLORS[severity]),
          borderRadius: 6,
          maxBarThickness: 36
        }]
      },
      options: this.compactChartOptions() as ChartConfiguration<'bar'>['options']
    };
  }

  private compactChartOptions() {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#94a3b8', font: { size: 10 } }
        },
        y: {
          beginAtZero: true,
          ticks: { color: '#94a3b8', font: { size: 10 }, precision: 0 },
          grid: { color: '#f1f5f9' }
        }
      }
    };
  }

  private destroyCharts(): void {
    this.soilHistoryChart?.destroy();
    this.alertsSeverityChart?.destroy();
    this.soilHistoryChart = undefined;
    this.alertsSeverityChart = undefined;
  }
}
