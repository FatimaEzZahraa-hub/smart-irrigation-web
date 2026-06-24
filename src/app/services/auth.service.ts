import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs';

import { environment } from '../../environments/environment';

export interface CurrentUser {
  id?: number;
  fullName: string;
  email: string;
  role?: string;
  createdAt?: string;
}

interface UserProfileResponse {
  id?: number;
  email?: string;
  nom_utilisateur?: string;
  username?: string;
  fullName?: string;
  full_name?: string;
  role?: string;
  createdAt?: string;
  created_at?: string;
  date_creation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(data: { email: string; mot_de_passe: string }) {
    return this.http.post(`${this.api}/login`, data);
  }

  register(data: { username: string; email: string; password: string }) {
    return this.http.post(`${this.api}/register`, data);
  }

  profile() {
    return this.http.get<UserProfileResponse>(`${this.api}/profile`, {
      headers: this.getAuthHeaders()
    }).pipe(map((user) => this.normalizeUser(user)));
  }

  logout(): void {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : new HttpHeaders();
  }

  private normalizeUser(user: UserProfileResponse): CurrentUser {
    const email = user.email || '';

    return {
      id: user.id,
      fullName: user.fullName || user.full_name || user.nom_utilisateur || user.username || email,
      email,
      role: user.role,
      createdAt: user.createdAt || user.created_at || user.date_creation
    };
  }
}
