import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { SensorService } from '../../services/sensor.service';
import { WeatherService, ZoneWeather } from '../../services/weather.service';
import { DeviceService, DeviceZone } from '../../services/device.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  humiditeSol = 0;
  temperature = 0;
  humiditeAir = 0;
  pompe = 'OFF';
  selectedZoneId = '1';
  selectedZoneName = 'Zone A';
  zones: DeviceZone[] = [];
  weather?: ZoneWeather;
  weatherLoading = false;
  weatherError = '';
  lastSensorUpdate?: Date;

  constructor(
    private sensorService: SensorService,
    private deviceService: DeviceService,
    public weatherService: WeatherService
  ) {}

  ngOnInit() {
    this.loadUserZones();
    this.loadZoneData(this.selectedZoneId);
  }

  get soilStatusKey(): string {
    if (this.humiditeSol < 35) {
      return 'DASHBOARD.SOIL.DRY';
    }

    if (this.humiditeSol > 75) {
      return 'DASHBOARD.SOIL.WET';
    }

    return 'DASHBOARD.SOIL.OPTIMAL';
  }

  get soilStatusClass(): string {
    if (this.humiditeSol < 35) {
      return 'dry';
    }

    if (this.humiditeSol > 75) {
      return 'wet';
    }

    return 'optimal';
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

  onZoneChange(event: Event): void {
    const zoneId = (event.target as HTMLSelectElement).value;
    const zone = this.zones.find((item) => String(item.id) === zoneId);

    this.selectedZoneId = zoneId;
    this.selectedZoneName = this.getZoneName(zone);
    this.loadZoneData(zoneId);
  }

  loadZoneData(zoneId: string): void {
    this.sensorService.getLatest(zoneId).subscribe({
      next: (res: any) => {
        this.humiditeSol = res.humidite_sol;
        this.temperature = res.temperature;
        this.humiditeAir = res.humidite_air;
        this.lastSensorUpdate = new Date();
      },
      error: (err) => {
        console.log('Erreur : ', err);
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
        console.error('Weather error:', err);
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
        this.zones = zones;

        if (zones.length > 0) {
          const firstZone = zones[0];
          this.selectedZoneId = String(firstZone.id);
          this.selectedZoneName = this.getZoneName(firstZone);
          this.loadZoneData(this.selectedZoneId);
        }
      },
      error: (err) => {
        console.error('Zones error:', err);
      }
    });
  }

  private getZoneName(zone?: DeviceZone): string {
    return zone?.nom || zone?.emplacement || 'Zone A';
  }
}
