import { Injectable } from '@angular/core';

import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { Sensor } from '../models/sensor';

export type SensorHistoryType = 'all' | 'soil' | 'air' | 'temperature';

export interface SensorHistoryFilters {
  startDate?: string;
  endDate?: string;
  type?: SensorHistoryType;
}

@Injectable({
  providedIn:'root'
})

export class SensorService {

  api = environment.apiUrl + '/sensors';

  constructor(private http: HttpClient) {}

  getLatest(deviceId: string) {

    return this.http.get(
      `${this.api}/latest/${deviceId}`
    );

  }

  getHistory(deviceId: string, filters: SensorHistoryFilters = {}) {
    let params = new HttpParams();

    if (filters.startDate) {
      params = params.set('startDate', filters.startDate);
    }

    if (filters.endDate) {
      params = params.set('endDate', filters.endDate);
    }

    if (filters.type && filters.type !== 'all') {
      params = params.set('type', filters.type);
    }

    return this.http.get<Sensor[]>(`${this.api}/history/${deviceId}`, {
      headers: this.getAuthHeaders(),
      params
    });

  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

}
