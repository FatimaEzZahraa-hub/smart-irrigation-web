import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { environment } from '../../../environments/environment';
import { AdminAuthService } from './admin-auth.service';
import { AdminDashboardSummary } from '../models/admin-dashboard-summary';
import { AdminUser } from '../models/admin-user';
import { AdminDevice } from '../models/admin-device';
import { AdminAlert } from '../models/admin-alert';

export interface AdminAlertFilters {
  severity?: string;
  resolved?: boolean;
  search?: string;
}

/**
 * Single HTTP gateway to the standalone Spring Boot admin API (port 8080).
 * Every call attaches the admin_token (never the regular user "token") via
 * a manually-built Authorization header, matching this project's existing
 * per-service pattern (no HTTP interceptor exists anywhere in this app).
 */
@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly api = environment.adminApiUrl;

  constructor(private http: HttpClient, private adminAuth: AdminAuthService) {}

  // Dashboard
  getDashboardSummary() {
    return this.http.get<AdminDashboardSummary>(`${this.api}/dashboard/summary`, {
      headers: this.getAuthHeaders()
    });
  }

  // Users
  getUsers() {
    return this.http.get<AdminUser[]>(`${this.api}/users`, { headers: this.getAuthHeaders() });
  }

  getUser(id: string) {
    return this.http.get<AdminUser>(`${this.api}/users/${id}`, { headers: this.getAuthHeaders() });
  }

  enableUser(id: string) {
    return this.http.patch<AdminUser>(`${this.api}/users/${id}/enable`, {}, { headers: this.getAuthHeaders() });
  }

  disableUser(id: string) {
    return this.http.patch<AdminUser>(`${this.api}/users/${id}/disable`, {}, { headers: this.getAuthHeaders() });
  }

  // Devices
  getDevices() {
    return this.http.get<AdminDevice[]>(`${this.api}/devices`, { headers: this.getAuthHeaders() });
  }

  activateDevice(id: string) {
    return this.http.patch<AdminDevice>(`${this.api}/devices/${id}/activate`, {}, { headers: this.getAuthHeaders() });
  }

  deactivateDevice(id: string) {
    return this.http.patch<AdminDevice>(`${this.api}/devices/${id}/deactivate`, {}, { headers: this.getAuthHeaders() });
  }

  // Alerts
  getAlerts(filters: AdminAlertFilters = {}) {
    let params = new HttpParams();

    if (filters.severity) {
      params = params.set('severity', filters.severity);
    }

    if (filters.resolved !== undefined) {
      params = params.set('resolved', String(filters.resolved));
    }

    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<AdminAlert[]>(`${this.api}/alerts`, { headers: this.getAuthHeaders(), params });
  }

  deleteAlertsOlderThan(days: number) {
    return this.http.delete<{ deletedCount: number }>(`${this.api}/alerts/older-than/${days}`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.adminAuth.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
