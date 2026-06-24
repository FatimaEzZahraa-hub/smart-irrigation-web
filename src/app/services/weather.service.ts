import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

export interface WeatherForecastItem {
  time: string;
  temperature: number;
  description: string;
  icon: string;
}

export interface ZoneWeather {
  location: string;
  temperature: number;
  humidity: number;
  description: string;
  windSpeed: number;
  icon: string;
  forecast: WeatherForecastItem[];
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly api = `${environment.apiUrl}/weather`;

  constructor(private http: HttpClient) {}

  getZoneWeather(zoneId: string) {
    return this.http.get<ZoneWeather>(`${this.api}/${zoneId}`, {
      headers: this.getAuthHeaders()
    });
  }

  getIconUrl(icon: string): string {
    return icon ? `https://openweathermap.org/img/wn/${icon}@2x.png` : '';
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }
}
