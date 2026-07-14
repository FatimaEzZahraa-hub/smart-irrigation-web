import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { AlertStateService, IrrigationAlert } from '../../services/alert-state.service';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css'
})
export class Alerts implements OnDestroy {
  alerts: IrrigationAlert[] = [];
  activeFilter: 'all' | 'unread' | 'warning' | 'info' | 'critical' = 'all';

  private alertsSub: Subscription;

  constructor(readonly alertState: AlertStateService) {
    this.alertsSub = alertState.alerts$.subscribe(alerts => {
      this.alerts = alerts;
    });
  }

  ngOnDestroy(): void {
    this.alertsSub.unsubscribe();
  }

  get unreadCount(): number {
    return this.alerts.filter(a => !a.read).length;
  }

  get filteredAlerts(): IrrigationAlert[] {
    switch (this.activeFilter) {
      case 'unread':   return this.alerts.filter(a => !a.read);
      case 'warning':  return this.alerts.filter(a => a.severity === 'warning');
      case 'info':     return this.alerts.filter(a => a.severity === 'info');
      case 'critical': return this.alerts.filter(a => a.severity === 'critical');
      default:         return this.alerts;
    }
  }

  countBySeverity(severity: string): number {
    return this.alerts.filter(a => a.severity === severity).length;
  }

  setFilter(filter: typeof this.activeFilter): void {
    this.activeFilter = filter;
  }

  markAsRead(alert: IrrigationAlert): void {
    this.alertState.markAsRead(alert.id);
  }

  markAllRead(): void {
    this.alertState.markAllRead();
  }

  resolveAlert(alert: IrrigationAlert, event: Event): void {
    event.stopPropagation();
    this.alertState.resolveAlert(alert.id);
  }

  deleteAlert(alert: IrrigationAlert, event: Event): void {
    event.stopPropagation();
    this.alertState.deleteAlert(alert.id);
  }

  getAlertIcon(type: IrrigationAlert['type']): string {
    return this.alertState.getIcon(type);
  }

  getRelativeTime(date: Date): string {
    return this.alertState.getRelativeTime(date);
  }

  formatFullDate(date: Date): string {
    return this.alertState.formatFullDate(date);
  }
}
