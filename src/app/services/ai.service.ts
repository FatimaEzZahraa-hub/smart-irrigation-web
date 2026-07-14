import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';
import { AiRecommendation } from '../models/ai-recommendation';

@Injectable({
  providedIn: 'root'
})
export class AiService {
  private readonly api = `${environment.apiUrl}/ai`;

  constructor(private http: HttpClient) {}

  getRecommendation(deviceId: string) {
    return this.http.get<AiRecommendation>(`${this.api}/recommendation/${deviceId}`, {
      headers: this.getAuthHeaders()
    });
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
