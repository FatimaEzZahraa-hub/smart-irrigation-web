import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

import { environment } from '../../environments/environment';

export interface DeviceZone {
  id: number;
  nom?: string;
  emplacement?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({
  providedIn: 'root'
})

export class DeviceService {

  private readonly api = `${environment.apiUrl}/devices`;

  constructor(private http:HttpClient){}

  getDevices(){

    return this.http.get<DeviceZone[]>(this.api, {
      headers: this.getAuthHeaders()
    });

  }

  getDevice(id:string){

    return this.http.get<DeviceZone>(`${this.api}/${id}`, {
      headers: this.getAuthHeaders()
    });

  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

}
