import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../services/admin-api.service';
import { AdminDashboardSummary } from '../../models/admin-dashboard-summary';
import { AdminAlert } from '../../models/admin-alert';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  summary?: AdminDashboardSummary;
  recentAlerts: AdminAlert[] = [];
  isLoading = false;
  errorMessage = '';
  alertsLoading = false;

  constructor(private adminApi: AdminApiService) {}

  ngOnInit(): void {
    this.loadSummary();
    this.loadRecentAlerts();
  }

  private loadSummary(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi
      .getDashboardSummary()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (summary) => (this.summary = summary),
        error: () => (this.errorMessage = 'Unable to load dashboard data.')
      });
  }

  private loadRecentAlerts(): void {
    this.alertsLoading = true;

    this.adminApi
      .getAlerts()
      .pipe(finalize(() => (this.alertsLoading = false)))
      .subscribe({
        next: (alerts) => (this.recentAlerts = alerts.slice(0, 5)),
        error: () => (this.recentAlerts = [])
      });
  }
}
