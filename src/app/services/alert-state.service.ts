import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { AlertService } from './alert.service';

export interface IrrigationAlert {
  id: string;
  type:
    | 'low_soil_moisture'
    | 'pump_activated'
    | 'heavy_rain'
    | 'high_temperature'
    | 'low_tank'
    | 'auto_irrigation_started'
    | 'auto_irrigation_postponed'
    | 'sensor_offline'
    | 'esp32_disconnected'
    | 'irrigation_start'
    | 'irrigation_complete'
    | 'rain_skip'
    | 'safety_stop';
  severity: 'warning' | 'info' | 'critical';
  zone: string;
  titleKey: string;
  descriptionKey: string;
  recommendationKey: string;
  sensorValue?: string;
  timestamp: Date;
  read: boolean;
  resolved: boolean;
  navLink?: string;
  navLabelKey?: string;
  navIcon?: string;
}

const DEMO_ALERTS: IrrigationAlert[] = [
  {
    id: 'a1',
    type: 'low_soil_moisture',
    severity: 'warning',
    zone: 'Zone A – Tomatoes',
    titleKey: 'ALERTS.LOW_SOIL_HUMIDITY',
    descriptionKey: 'ALERTS.LOW_SOIL_HUMIDITY_DESC',
    recommendationKey: 'ALERTS.LOW_SOIL_HUMIDITY_REC',
    sensorValue: '18%',
    timestamp: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    resolved: false,
    navLink: '/pump-control',
    navLabelKey: 'ALERTS.NAV.VIEW_PUMP',
    navIcon: 'water_pump'
  },
  {
    id: 'a2',
    type: 'auto_irrigation_started',
    severity: 'info',
    zone: 'Zone A – Tomatoes',
    titleKey: 'ALERTS.AUTO_IRRIGATION_STARTED',
    descriptionKey: 'ALERTS.AUTO_IRRIGATION_STARTED_DESC',
    recommendationKey: 'ALERTS.AUTO_IRRIGATION_STARTED_REC',
    timestamp: new Date(Date.now() - 18 * 60 * 1000),
    read: false,
    resolved: false,
    navLink: '/history',
    navLabelKey: 'ALERTS.NAV.VIEW_HISTORY',
    navIcon: 'history'
  },
  {
    id: 'a3',
    type: 'heavy_rain',
    severity: 'info',
    zone: 'Zone B – Peppers',
    titleKey: 'ALERTS.HEAVY_RAIN',
    descriptionKey: 'ALERTS.HEAVY_RAIN_DESC',
    recommendationKey: 'ALERTS.HEAVY_RAIN_REC',
    timestamp: new Date(Date.now() - 40 * 60 * 1000),
    read: false,
    resolved: false,
    navLink: '/dashboard',
    navLabelKey: 'ALERTS.NAV.VIEW_DASHBOARD',
    navIcon: 'dashboard'
  },
  {
    id: 'a4',
    type: 'high_temperature',
    severity: 'critical',
    zone: 'Zone C – Herbs',
    titleKey: 'ALERTS.HIGH_TEMPERATURE',
    descriptionKey: 'ALERTS.HIGH_TEMPERATURE_DESC',
    recommendationKey: 'ALERTS.HIGH_TEMPERATURE_REC',
    sensorValue: '42°C',
    timestamp: new Date(Date.now() - 95 * 60 * 1000),
    read: false,
    resolved: false,
    navLink: '/analyses',
    navLabelKey: 'ALERTS.NAV.VIEW_ANALYTICS',
    navIcon: 'analytics'
  },
  {
    id: 'a5',
    type: 'pump_activated',
    severity: 'info',
    zone: 'Zone B – Peppers',
    titleKey: 'ALERTS.PUMP_ACTIVATED',
    descriptionKey: 'ALERTS.PUMP_ACTIVATED_DESC',
    recommendationKey: 'ALERTS.PUMP_ACTIVATED_REC',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: true,
    resolved: false,
    navLink: '/history',
    navLabelKey: 'ALERTS.NAV.VIEW_HISTORY',
    navIcon: 'history'
  },
  {
    id: 'a6',
    type: 'auto_irrigation_postponed',
    severity: 'warning',
    zone: 'Zone C – Herbs',
    titleKey: 'ALERTS.AUTO_IRRIGATION_POSTPONED',
    descriptionKey: 'ALERTS.AUTO_IRRIGATION_POSTPONED_DESC',
    recommendationKey: 'ALERTS.AUTO_IRRIGATION_POSTPONED_REC',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    resolved: true,
    navLink: '/dashboard',
    navLabelKey: 'ALERTS.NAV.VIEW_DASHBOARD',
    navIcon: 'dashboard'
  },
  {
    id: 'a7',
    type: 'low_tank',
    severity: 'critical',
    zone: 'Zone A – Tomatoes',
    titleKey: 'ALERTS.LOW_TANK',
    descriptionKey: 'ALERTS.LOW_TANK_DESC',
    recommendationKey: 'ALERTS.LOW_TANK_REC',
    sensorValue: '8%',
    timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000),
    read: true,
    resolved: false,
    navLink: '/dashboard',
    navLabelKey: 'ALERTS.NAV.VIEW_DASHBOARD',
    navIcon: 'dashboard'
  },
  {
    id: 'a8',
    type: 'sensor_offline',
    severity: 'warning',
    zone: 'Zone B – Peppers',
    titleKey: 'ALERTS.SENSOR_OFFLINE',
    descriptionKey: 'ALERTS.SENSOR_OFFLINE_DESC',
    recommendationKey: 'ALERTS.SENSOR_OFFLINE_REC',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    resolved: true,
    navLink: '/dashboard',
    navLabelKey: 'ALERTS.NAV.VIEW_DASHBOARD',
    navIcon: 'dashboard'
  },
  {
    id: 'a9',
    type: 'esp32_disconnected',
    severity: 'critical',
    zone: 'Zone C – Herbs',
    titleKey: 'ALERTS.ESP32_DISCONNECTED',
    descriptionKey: 'ALERTS.ESP32_DISCONNECTED_DESC',
    recommendationKey: 'ALERTS.ESP32_DISCONNECTED_REC',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    read: true,
    resolved: true,
    navLink: '/dashboard',
    navLabelKey: 'ALERTS.NAV.VIEW_DASHBOARD',
    navIcon: 'dashboard'
  }
];

const TYPE_MAP: Record<string, IrrigationAlert['type']> = {
  low_soil_humidity:         'low_soil_moisture',
  low_soil_moisture:         'low_soil_moisture',
  pump_activated:            'pump_activated',
  heavy_rain:                'heavy_rain',
  high_temperature:          'high_temperature',
  low_tank:                  'low_tank',
  auto_irrigation_started:   'auto_irrigation_started',
  auto_irrigation_postponed: 'auto_irrigation_postponed',
  sensor_offline:            'sensor_offline',
  esp32_disconnected:        'esp32_disconnected',
  irrigation_start:          'irrigation_start',
  irrigation_complete:       'irrigation_complete',
  rain_skip:                 'rain_skip',
  safety_stop:               'safety_stop'
};

const TITLE_KEY: Record<IrrigationAlert['type'], string> = {
  low_soil_moisture:         'ALERTS.LOW_SOIL_HUMIDITY',
  pump_activated:            'ALERTS.PUMP_ACTIVATED',
  heavy_rain:                'ALERTS.HEAVY_RAIN',
  high_temperature:          'ALERTS.HIGH_TEMPERATURE',
  low_tank:                  'ALERTS.LOW_TANK',
  auto_irrigation_started:   'ALERTS.AUTO_IRRIGATION_STARTED',
  auto_irrigation_postponed: 'ALERTS.AUTO_IRRIGATION_POSTPONED',
  sensor_offline:            'ALERTS.SENSOR_OFFLINE',
  esp32_disconnected:        'ALERTS.ESP32_DISCONNECTED',
  irrigation_start:          'ALERTS.IRRIGATION_START',
  irrigation_complete:       'ALERTS.IRRIGATION_COMPLETE',
  rain_skip:                 'ALERTS.RAIN_SKIP',
  safety_stop:               'ALERTS.SAFETY_STOP'
};

const DESC_KEY: Record<IrrigationAlert['type'], string> = {
  low_soil_moisture:         'ALERTS.LOW_SOIL_HUMIDITY_DESC',
  pump_activated:            'ALERTS.PUMP_ACTIVATED_DESC',
  heavy_rain:                'ALERTS.HEAVY_RAIN_DESC',
  high_temperature:          'ALERTS.HIGH_TEMPERATURE_DESC',
  low_tank:                  'ALERTS.LOW_TANK_DESC',
  auto_irrigation_started:   'ALERTS.AUTO_IRRIGATION_STARTED_DESC',
  auto_irrigation_postponed: 'ALERTS.AUTO_IRRIGATION_POSTPONED_DESC',
  sensor_offline:            'ALERTS.SENSOR_OFFLINE_DESC',
  esp32_disconnected:        'ALERTS.ESP32_DISCONNECTED_DESC',
  irrigation_start:          'ALERTS.IRRIGATION_START_DESC',
  irrigation_complete:       'ALERTS.IRRIGATION_COMPLETE_DESC',
  rain_skip:                 'ALERTS.RAIN_SKIP_DESC',
  safety_stop:               'ALERTS.SAFETY_STOP_DESC'
};

const REC_KEY: Record<IrrigationAlert['type'], string> = {
  low_soil_moisture:         'ALERTS.LOW_SOIL_HUMIDITY_REC',
  pump_activated:            'ALERTS.PUMP_ACTIVATED_REC',
  heavy_rain:                'ALERTS.HEAVY_RAIN_REC',
  high_temperature:          'ALERTS.HIGH_TEMPERATURE_REC',
  low_tank:                  'ALERTS.LOW_TANK_REC',
  auto_irrigation_started:   'ALERTS.AUTO_IRRIGATION_STARTED_REC',
  auto_irrigation_postponed: 'ALERTS.AUTO_IRRIGATION_POSTPONED_REC',
  sensor_offline:            'ALERTS.SENSOR_OFFLINE_REC',
  esp32_disconnected:        'ALERTS.ESP32_DISCONNECTED_REC',
  irrigation_start:          'ALERTS.IRRIGATION_START_REC',
  irrigation_complete:       'ALERTS.IRRIGATION_COMPLETE_REC',
  rain_skip:                 'ALERTS.RAIN_SKIP_REC',
  safety_stop:               'ALERTS.SAFETY_STOP_REC'
};

const NAV_LINK: Record<IrrigationAlert['type'], string> = {
  low_soil_moisture:         '/pump-control',
  pump_activated:            '/history',
  heavy_rain:                '/dashboard',
  high_temperature:          '/analyses',
  low_tank:                  '/dashboard',
  auto_irrigation_started:   '/history',
  auto_irrigation_postponed: '/dashboard',
  sensor_offline:            '/dashboard',
  esp32_disconnected:        '/dashboard',
  irrigation_start:          '/history',
  irrigation_complete:       '/history',
  rain_skip:                 '/dashboard',
  safety_stop:               '/pump-control'
};

const NAV_LABEL: Record<IrrigationAlert['type'], string> = {
  low_soil_moisture:         'ALERTS.NAV.VIEW_PUMP',
  pump_activated:            'ALERTS.NAV.VIEW_HISTORY',
  heavy_rain:                'ALERTS.NAV.VIEW_DASHBOARD',
  high_temperature:          'ALERTS.NAV.VIEW_ANALYTICS',
  low_tank:                  'ALERTS.NAV.VIEW_DASHBOARD',
  auto_irrigation_started:   'ALERTS.NAV.VIEW_HISTORY',
  auto_irrigation_postponed: 'ALERTS.NAV.VIEW_DASHBOARD',
  sensor_offline:            'ALERTS.NAV.VIEW_DASHBOARD',
  esp32_disconnected:        'ALERTS.NAV.VIEW_DASHBOARD',
  irrigation_start:          'ALERTS.NAV.VIEW_HISTORY',
  irrigation_complete:       'ALERTS.NAV.VIEW_HISTORY',
  rain_skip:                 'ALERTS.NAV.VIEW_DASHBOARD',
  safety_stop:               'ALERTS.NAV.VIEW_PUMP'
};

const NAV_ICON: Record<IrrigationAlert['type'], string> = {
  low_soil_moisture:         'water_pump',
  pump_activated:            'history',
  heavy_rain:                'dashboard',
  high_temperature:          'analytics',
  low_tank:                  'dashboard',
  auto_irrigation_started:   'history',
  auto_irrigation_postponed: 'dashboard',
  sensor_offline:            'dashboard',
  esp32_disconnected:        'dashboard',
  irrigation_start:          'history',
  irrigation_complete:       'history',
  rain_skip:                 'dashboard',
  safety_stop:               'water_pump'
};

@Injectable({ providedIn: 'root' })
export class AlertStateService implements OnDestroy {
  private readonly _alerts$ = new BehaviorSubject<IrrigationAlert[]>([]);
  private loadSub?: Subscription;

  readonly alerts$: Observable<IrrigationAlert[]> = this._alerts$.asObservable();

  readonly unreadCount$: Observable<number> = this.alerts$.pipe(
    map(alerts => alerts.filter(a => !a.read).length)
  );

  readonly recentAlerts$: Observable<IrrigationAlert[]> = this.alerts$.pipe(
    map(alerts =>
      [...alerts]
        .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
        .slice(0, 3)
    )
  );

  constructor(
    private alertService: AlertService,
    private translate: TranslateService
  ) {
    this.loadAlerts();
  }

  ngOnDestroy(): void {
    this.loadSub?.unsubscribe();
  }

  markAsRead(id: string): void {
    this._alerts$.next(
      this._alerts$.value.map(a => a.id === id ? { ...a, read: true } : a)
    );
  }

  markAllRead(): void {
    this._alerts$.next(this._alerts$.value.map(a => ({ ...a, read: true })));
  }

  resolveAlert(id: string): void {
    this._alerts$.next(
      this._alerts$.value.map(a => a.id === id ? { ...a, resolved: true, read: true } : a)
    );
    this.alertService.resolve(id).subscribe();
  }

  deleteAlert(id: string): void {
    this._alerts$.next(this._alerts$.value.filter(a => a.id !== id));
  }

  getIcon(type: IrrigationAlert['type']): string {
    switch (type) {
      case 'low_soil_moisture':         return 'water_drop';
      case 'pump_activated':            return 'water_pump';
      case 'heavy_rain':                return 'thunderstorm';
      case 'high_temperature':          return 'device_thermostat';
      case 'low_tank':                  return 'water';
      case 'auto_irrigation_started':   return 'play_circle';
      case 'auto_irrigation_postponed': return 'pause_circle';
      case 'sensor_offline':            return 'sensors_off';
      case 'esp32_disconnected':        return 'wifi_off';
      case 'irrigation_start':          return 'opacity';
      case 'irrigation_complete':       return 'check_circle';
      case 'rain_skip':                 return 'umbrella';
      case 'safety_stop':               return 'report_problem';
    }
  }

  getRelativeTime(date: Date): string {
    const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMin < 1)  return this.translate.instant('ALERTS.TIME.JUST_NOW');
    if (diffMin < 60) return this.translate.instant('ALERTS.TIME.MIN_AGO', { n: diffMin });
    const diffH = Math.floor(diffMin / 60);
    if (diffH === 1)  return this.translate.instant('ALERTS.TIME.HOUR_AGO');
    if (diffH < 24)   return this.translate.instant('ALERTS.TIME.HOURS_AGO', { n: diffH });
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1)  return this.translate.instant('ALERTS.TIME.YESTERDAY');
    return this.translate.instant('ALERTS.TIME.DAYS_AGO', { n: diffD });
  }

  formatFullDate(date: Date): string {
    return date.toLocaleString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  private loadAlerts(): void {
    this.loadSub = this.alertService.getAll().subscribe({
      next: (data: any) => {
        const raw: any[] = Array.isArray(data) ? data : [];
        this._alerts$.next(
          raw.length > 0 ? raw.map((item, i) => this.mapAlert(item, i)) : DEMO_ALERTS
        );
      },
      error: () => {
        this._alerts$.next(DEMO_ALERTS);
      }
    });
  }

  private mapAlert(raw: any, idx: number): IrrigationAlert {
    const type: IrrigationAlert['type'] =
      TYPE_MAP[String(raw.type_alerte ?? '').toLowerCase()] ?? 'low_soil_moisture';

    const sevRaw = String(raw.severite ?? '').toLowerCase();
    const severity: IrrigationAlert['severity'] =
      sevRaw === 'critical' ? 'critical' : sevRaw === 'info' ? 'info' : 'warning';

    return {
      id:              String(raw.id ?? idx),
      type,
      severity,
      zone:            String(raw.message ?? 'Zone A'),
      titleKey:        TITLE_KEY[type],
      descriptionKey:  DESC_KEY[type],
      recommendationKey: REC_KEY[type],
      timestamp:       new Date(raw.cree_le ?? Date.now()),
      read:            !!raw.resolue,
      resolved:        !!raw.resolue,
      navLink:         NAV_LINK[type],
      navLabelKey:     NAV_LABEL[type],
      navIcon:         NAV_ICON[type]
    };
  }
}
