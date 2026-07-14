import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PumpService {

  private readonly api = `${environment.apiUrl}/pump`;

  constructor(private http: HttpClient) {}

  turnOn(deviceId: string) {
    return this.http.post(`${this.api}/on`, { deviceId }, {
      headers: this.getAuthHeaders()
    });
  }

  turnOff(deviceId: string) {
    return this.http.post(`${this.api}/off`, { deviceId }, {
      headers: this.getAuthHeaders()
    });
  }

  history(deviceId: string) {
    return this.http.get(`${this.api}/history/${deviceId}`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

}
