import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AlertService {

  private readonly api = `${environment.apiUrl}/alerts`;

  constructor(private http: HttpClient) {}

  getAll() {
    return this.http.get(this.api, {
      headers: this.getAuthHeaders()
    });
  }

  resolve(id: string) {
    return this.http.patch(`${this.api}/${id}/resolve`, {}, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

}
