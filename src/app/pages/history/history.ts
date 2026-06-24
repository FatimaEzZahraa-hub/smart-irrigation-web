import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { finalize } from 'rxjs';

import { DeviceService, DeviceZone } from '../../services/device.service';
import { SensorService, SensorHistoryType } from '../../services/sensor.service';
import { Sensor } from '../../models/sensor';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './history.html',
  styleUrl: './history.css'
})
export class History {
  history: Sensor[] = [];
  zones: DeviceZone[] = [];
  selectedZoneId = '';
  selectedType: SensorHistoryType = 'all';
  startDate = '';
  endDate = '';
  isLoading = false;
  errorMessage = '';

  readonly sensorTypes: SensorHistoryType[] = ['all', 'soil', 'air', 'temperature'];

  constructor(
    private deviceService: DeviceService,
    private sensorService: SensorService
  ) {
    this.loadZones();
  }

  get averageSoil(): number {
    return this.getAverage('humidite_sol');
  }

  get averageTemperature(): number {
    return this.getAverage('temperature');
  }

  applyFilters(): void {
    if (!this.selectedZoneId) {
      this.history = [];
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.sensorService.getHistory(this.selectedZoneId, {
      startDate: this.startDate,
      endDate: this.endDate,
      type: this.selectedType
    })
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (history) => {
          this.history = history;
        },
        error: () => {
          this.history = [];
          this.errorMessage = 'HISTORY.ERROR';
        }
      });
  }

  resetFilters(): void {
    this.selectedType = 'all';
    this.startDate = '';
    this.endDate = '';
    this.applyFilters();
  }

  getZoneName(zone?: DeviceZone): string {
    return zone?.nom || zone?.emplacement || 'Zone A';
  }

  getTypeLabel(type: SensorHistoryType | undefined = this.selectedType): string {
    return `HISTORY.TYPE.${(type || 'all').toUpperCase()}`;
  }

  getMetricValue(item: Sensor): number {
    if (item.metric_value !== undefined && item.metric_value !== null) {
      return Number(item.metric_value);
    }

    if (this.selectedType === 'temperature') {
      return item.temperature;
    }

    if (this.selectedType === 'air') {
      return item.humidite_air;
    }

    return item.humidite_sol;
  }

  getMetricUnit(): string {
    return this.selectedType === 'temperature' ? '\u00b0C' : '%';
  }

  private loadZones(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.deviceService.getDevices()
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (zones) => {
          this.zones = zones;
          this.selectedZoneId = zones.length ? String(zones[0].id) : '';
          this.applyFilters();
        },
        error: () => {
          this.history = [];
          this.errorMessage = 'HISTORY.ERROR';
        }
      });
  }

  private getAverage(field: 'humidite_sol' | 'temperature'): number {
    if (!this.history.length) {
      return 0;
    }

    const total = this.history.reduce((sum, item) => sum + Number(item[field] || 0), 0);
    return Math.round(total / this.history.length);
  }
}
