import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

export interface DeviceZone {
  id: number;
  nom?: string;
  emplacement?: string;
  latitude?: number;
  longitude?: number;
  mode?: string;
}

export interface DeviceDetail extends DeviceZone {
  name?: string;
  location?: string;
  api_key?: string;
  cle_api?: string;
  is_active?: boolean;
  est_actif?: boolean;
  last_connection?: string | null;
  derniere_connexion?: string | null;
  created_at?: string;
  cree_le?: string;
  updated_at?: string;
}

export interface DeviceSettings {
  humidityThreshold: number;
  irrigationDurationMinutes: number;
  isRainSkipEnabled: boolean;
  plantName?: string | null;
  plantingDate?: string | null;
  updatedAt?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class DeviceService {

  private readonly api = `${environment.apiUrl}/devices`;

  constructor(private http: HttpClient) {}

  getDevices() {
    return this.http.get<DeviceDetail[]>(this.api, {
      headers: this.getAuthHeaders()
    });
  }

  getDevice(id: string) {
    return this.http.get<DeviceDetail>(`${this.api}/${id}`, {
      headers: this.getAuthHeaders()
    });
  }

  getSettings(id: string) {
    return this.http.get<DeviceSettings>(`${this.api}/${id}/settings`, {
      headers: this.getAuthHeaders()
    });
  }

  updateSettings(id: string, body: DeviceSettings) {
    return this.http.put(`${this.api}/${id}/settings`, body, {
      headers: this.getAuthHeaders()
    });
  }

  updateMode(id: string, mode: 'manual' | 'auto') {
    return this.http.patch(`${this.api}/${id}/mode`, { mode }, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
