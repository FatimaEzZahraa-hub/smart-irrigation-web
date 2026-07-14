import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';

import { PumpService } from '../../services/pump.service';
import { DeviceService, DeviceSettings } from '../../services/device.service';
import { ZoneStateService } from '../../services/zone-state.service';
import { SensorService } from '../../services/sensor.service';

const SENSOR_STALE_AFTER_MINUTES = 15;

interface ConfirmRequest {
  titleKey: string;
  messageKey: string;
  confirmKey: string;
  action: () => void;
}

@Component({
  selector: 'app-pump-control',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatTooltipModule, TranslatePipe],
  templateUrl: './pump-control.html',
  styleUrl: './pump-control.css'
})
export class PumpControl implements OnInit {
  status: 'ON' | 'OFF' = 'OFF';
  pumpTransition: 'starting' | 'stopping' | null = null;
  automaticMode = false;
  humidityThreshold = 40;
  irrigationDuration = 10;
  plantName = '';
  plantingDate = '';
  zoneName = '';
  feedbackKey = '';
  feedbackType: 'success' | 'error' = 'success';

  soilMoisture?: number;
  lastSensorUpdate?: Date;
  sensorUnavailable = false;

  pumpHistory: any[] = [];
  lastActivation?: Date;
  settingsUpdatedAt?: Date;

  confirmRequest: ConfirmRequest | null = null;

  private deviceId = '';
  private isRainSkipEnabled = false;
  private isSubmitting = false;

  constructor(
    private pumpService: PumpService,
    private deviceService: DeviceService,
    private zoneState: ZoneStateService,
    private sensorService: SensorService
  ) {}

  ngOnInit(): void {
    const savedId = this.zoneState.selectedZoneId;
    if (savedId) {
      this.deviceId = savedId;
      this.loadPageData();
    } else {
      this.deviceService.getDevices().subscribe({
        next: (zones) => {
          if (zones.length === 0) {
            this.showFeedback('PUMP.ERROR_NO_DEVICE', 'error');
            return;
          }
          this.deviceId = String(zones[0].id);
          this.zoneState.setZone(this.deviceId);
          this.loadPageData();
        },
        error: () => {
          this.showFeedback('PUMP.ERROR_LOAD', 'error');
        }
      });
    }
  }

  get sensorFreshnessMinutes(): number | null {
    if (!this.lastSensorUpdate) {
      return null;
    }
    return Math.floor((Date.now() - this.lastSensorUpdate.getTime()) / 60000);
  }

  get isSensorStale(): boolean {
    const minutes = this.sensorFreshnessMinutes;
    return minutes === null || minutes > SENSOR_STALE_AFTER_MINUTES;
  }

  get isDeviceOnline(): boolean {
    return !this.sensorUnavailable && !this.isSensorStale;
  }

  get isBelowThreshold(): boolean {
    return this.soilMoisture !== undefined && this.soilMoisture < this.humidityThreshold;
  }

  get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  get pumpStatusLabelKey(): string {
    if (this.pumpTransition === 'starting') {
      return 'PUMP.STARTING';
    }
    if (this.pumpTransition === 'stopping') {
      return 'PUMP.STOPPING';
    }
    return this.status === 'ON' ? 'PUMP.STATUS_ON' : 'PUMP.STATUS_OFF';
  }

  get recentActivity(): any[] {
    return this.pumpHistory.slice(0, 6);
  }

  get systemStatusClass(): 'ready' | 'offline' | 'connection-issue' {
    const isConnectionError =
      this.feedbackType === 'error' &&
      (this.feedbackKey === 'PUMP.ERROR_LOAD' ||
        this.feedbackKey === 'PUMP.ERROR_NETWORK' ||
        this.feedbackKey === 'PUMP.ERROR_NO_DEVICE');

    if (isConnectionError) {
      return 'connection-issue';
    }
    if (!this.isDeviceOnline) {
      return 'offline';
    }
    return 'ready';
  }

  get systemStatusKey(): string {
    switch (this.systemStatusClass) {
      case 'connection-issue':
        return 'PUMP.SYSTEM_STATUS.CONNECTION_ISSUE';
      case 'offline':
        return 'PUMP.SYSTEM_STATUS.OFFLINE';
      default:
        return 'PUMP.SYSTEM_STATUS.READY';
    }
  }

  get pumpReasonKey(): string {
    const latest = this.pumpHistory[0];
    if (!latest) {
      return 'PUMP.REASON_NONE';
    }

    const trigger = latest.triggered_by ?? latest.declenche_par;
    const isOn = latest.action === 'ON';

    if (trigger === 'automatic') {
      return isOn ? 'PUMP.REASON_AUTO_ON' : 'PUMP.REASON_AUTO_OFF';
    }
    if (trigger === 'system') {
      return isOn ? 'PUMP.REASON_MANUAL_ON' : 'PUMP.REASON_SAFETY_OFF';
    }
    return isOn ? 'PUMP.REASON_MANUAL_ON' : 'PUMP.REASON_MANUAL_OFF';
  }

  triggeredByKey(entry: any): string {
    const value = entry?.triggered_by ?? entry?.declenche_par;
    if (value === 'automatic') {
      return 'PUMP.TRIGGERED_AUTO';
    }
    if (value === 'system') {
      return 'PUMP.TRIGGERED_SAFETY';
    }
    return 'PUMP.TRIGGERED_MANUAL';
  }

  triggerIcon(entry: any): string {
    const value = entry?.triggered_by ?? entry?.declenche_par;
    if (value === 'automatic') {
      return 'auto_mode';
    }
    if (value === 'system') {
      return 'shield';
    }
    return 'pan_tool';
  }

  eventDate(entry: any): Date | null {
    const raw = entry?.declenche_le ?? entry?.triggered_at;
    return raw ? new Date(raw) : null;
  }

  confirmTurnOn(): void {
    if (this.isSubmitting || this.status === 'ON') {
      return;
    }
    this.requestConfirmation('PUMP.CONFIRM_TITLE_START', 'PUMP.CONFIRM_MSG_START', 'PUMP.TURN_ON', () => this.turnOn());
  }

  confirmTurnOff(): void {
    if (this.isSubmitting || this.status === 'OFF') {
      return;
    }
    this.requestConfirmation('PUMP.CONFIRM_TITLE_STOP', 'PUMP.CONFIRM_MSG_STOP', 'PUMP.TURN_OFF', () => this.turnOff());
  }

  confirmToggleAutomaticMode(): void {
    if (this.isSubmitting) {
      return;
    }
    const willEnable = !this.automaticMode;
    this.requestConfirmation(
      willEnable ? 'PUMP.CONFIRM_TITLE_AUTO_ON' : 'PUMP.CONFIRM_TITLE_AUTO_OFF',
      willEnable ? 'PUMP.CONFIRM_MSG_AUTO_ON' : 'PUMP.CONFIRM_MSG_AUTO_OFF',
      willEnable ? 'PUMP.ENABLED' : 'PUMP.DISABLED',
      () => this.toggleAutomaticMode()
    );
  }

  acceptConfirmation(): void {
    const action = this.confirmRequest?.action;
    this.confirmRequest = null;
    action?.();
  }

  cancelConfirmation(): void {
    this.confirmRequest = null;
  }

  private requestConfirmation(titleKey: string, messageKey: string, confirmKey: string, action: () => void): void {
    this.confirmRequest = { titleKey, messageKey, confirmKey, action };
  }

  private turnOn(): void {
    this.isSubmitting = true;
    this.pumpTransition = 'starting';
    this.pumpService.turnOn(this.deviceId).pipe(
      finalize(() => { this.isSubmitting = false; this.pumpTransition = null; })
    ).subscribe({
      next: () => {
        this.status = 'ON';
        this.lastActivation = new Date();
        this.pushHistoryEntry('ON');
        this.showFeedback('PUMP.CONFIRM_PUMP_ON');
      },
      error: (err) => {
        this.showFeedback(this.networkAwareKey(err, 'PUMP.ERROR_PUMP_ON'), 'error');
      }
    });
  }

  private turnOff(): void {
    this.isSubmitting = true;
    this.pumpTransition = 'stopping';
    this.pumpService.turnOff(this.deviceId).pipe(
      finalize(() => { this.isSubmitting = false; this.pumpTransition = null; })
    ).subscribe({
      next: () => {
        this.status = 'OFF';
        this.pushHistoryEntry('OFF');
        this.showFeedback('PUMP.CONFIRM_PUMP_OFF');
      },
      error: (err) => {
        this.showFeedback(this.networkAwareKey(err, 'PUMP.ERROR_PUMP_OFF'), 'error');
      }
    });
  }

  private toggleAutomaticMode(): void {
    const previousMode = this.automaticMode;
    const newMode: 'manual' | 'auto' = previousMode ? 'manual' : 'auto';

    this.automaticMode = !previousMode;
    this.isSubmitting = true;
    this.showFeedback('PUMP.UPDATING_MODE');

    this.deviceService.updateMode(this.deviceId, newMode).pipe(
      finalize(() => { this.isSubmitting = false; })
    ).subscribe({
      next: () => {
        this.showFeedback(this.automaticMode ? 'PUMP.CONFIRM_AUTO_ON' : 'PUMP.CONFIRM_AUTO_OFF');
      },
      error: (err) => {
        this.automaticMode = previousMode;
        this.showFeedback(this.networkAwareKey(err, 'PUMP.ERROR_MODE'), 'error');
      }
    });
  }

  saveSettings(): void {
    if (this.isSubmitting) {
      return;
    }

    if (this.plantingDate) {
      const parsedDate = new Date(`${this.plantingDate}T00:00:00`);
      if (!Number.isNaN(parsedDate.getTime()) && parsedDate.getTime() > Date.now()) {
        this.showFeedback('PUMP.ERROR_PLANTING_DATE_FUTURE', 'error');
        return;
      }
    }

    const beforeThreshold = this.humidityThreshold;
    const beforeDuration = this.irrigationDuration;

    this.humidityThreshold = this.clamp(this.humidityThreshold, 10, 90);
    this.irrigationDuration = Math.round(this.clamp(this.irrigationDuration, 1, 120));

    const wasAdjusted =
      beforeThreshold !== this.humidityThreshold ||
      beforeDuration !== this.irrigationDuration;

    if (wasAdjusted) {
      this.showFeedback('PUMP.ERROR_SETTINGS_ADJUSTED', 'error');
    }

    this.isSubmitting = true;
    this.deviceService.updateSettings(this.deviceId, {
      humidityThreshold: this.humidityThreshold,
      irrigationDurationMinutes: this.irrigationDuration,
      isRainSkipEnabled: this.isRainSkipEnabled,
      plantName: this.plantName.trim() || null,
      plantingDate: this.plantingDate || null
    }).pipe(
      finalize(() => { this.isSubmitting = false; })
    ).subscribe({
      next: (response: any) => {
        this.settingsUpdatedAt = response?.settings?.updated_at ? new Date(response.settings.updated_at) : new Date();
        if (!wasAdjusted) {
          this.showFeedback('PUMP.CONFIRM_SETTINGS_SAVED');
        }
      },
      error: (err) => {
        if (err?.status === 400) {
          this.showFeedback('PUMP.ERROR_SETTINGS_INVALID', 'error');
        } else {
          this.showFeedback(this.networkAwareKey(err, 'PUMP.ERROR_SETTINGS'), 'error');
        }
      }
    });
  }

  private loadPageData(): void {
    forkJoin({
      pumpHistory: this.pumpService.history(this.deviceId).pipe(catchError(() => of([]))),
      settings: this.deviceService.getSettings(this.deviceId).pipe(catchError(() => of(null))),
      device: this.deviceService.getDevice(this.deviceId).pipe(catchError(() => of(null))),
      sensorLatest: this.sensorService.getLatest(this.deviceId).pipe(catchError(() => of(null)))
    }).subscribe({
      next: ({ pumpHistory, settings, device, sensorLatest }) => {
        const logs = Array.isArray(pumpHistory) ? pumpHistory as any[] : [];
        this.pumpHistory = logs;
        this.status = logs.length > 0 && logs[0].action === 'ON' ? 'ON' : 'OFF';

        const lastOnEntry = logs.find((entry) => entry.action === 'ON');
        this.lastActivation = lastOnEntry ? this.eventDate(lastOnEntry) ?? undefined : undefined;

        if (device?.mode) {
          this.automaticMode = device.mode === 'auto';
        }
        this.zoneName = (device as any)?.nom || (device as any)?.emplacement || '';

        if (settings) {
          this.humidityThreshold = settings.humidityThreshold ?? 40;
          this.irrigationDuration = settings.irrigationDurationMinutes ?? 10;
          this.isRainSkipEnabled = settings.isRainSkipEnabled ?? false;
          this.plantName = settings.plantName ?? '';
          this.plantingDate = settings.plantingDate ?? '';
          this.settingsUpdatedAt = settings.updatedAt ? new Date(settings.updatedAt) : undefined;
        }

        const reading = sensorLatest as any;
        if (reading && typeof reading.humidite_sol === 'number') {
          this.soilMoisture = reading.humidite_sol;
          this.lastSensorUpdate = reading.enregistre_le ? new Date(reading.enregistre_le) : undefined;
          this.sensorUnavailable = false;
        } else {
          this.soilMoisture = undefined;
          this.lastSensorUpdate = undefined;
          this.sensorUnavailable = true;
        }

        this.showFeedback('PUMP.CONFIRM_READY');
      },
      error: () => {
        this.showFeedback('PUMP.ERROR_LOAD', 'error');
      }
    });
  }

  private showFeedback(key: string, type: 'success' | 'error' = 'success'): void {
    this.feedbackKey = key;
    this.feedbackType = type;
  }

  private networkAwareKey(err: any, fallbackKey: string): string {
    return err?.status === 0 ? 'PUMP.ERROR_NETWORK' : fallbackKey;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(Number(value) || min, min), max);
  }

  private pushHistoryEntry(action: 'ON' | 'OFF'): void {
    const now = new Date().toISOString();
    this.pumpHistory = [
      { action, triggered_by: 'manual', declenche_par: 'manual', triggered_at: now, declenche_le: now },
      ...this.pumpHistory
    ];
  }
}
