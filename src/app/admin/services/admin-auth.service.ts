import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

import { environment } from '../../../environments/environment';

export interface AdminLoginResponse {
  token: string;
  expiresInMs: number;
}

const ADMIN_TOKEN_KEY = 'admin_token';

@Injectable({
  providedIn: 'root'
})
export class AdminAuthService {
  private readonly api = `${environment.adminApiUrl}/auth`;

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.api}/login`, { email, password }).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(ADMIN_TOKEN_KEY, res.token);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
