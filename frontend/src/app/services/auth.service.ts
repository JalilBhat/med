import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    createdAt: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = 'http://localhost:8080/api/v1/users';

  constructor(private http: HttpClient) {}

  login(payload: LoginRequest) {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, payload).pipe(
      tap((response) => {
        if (response.token) {
          localStorage.setItem('authToken', response.token);
        }
      }),
    );
  }

  register(payload: RegisterRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/register`, payload)
      .pipe(
        tap((response) => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
          }
        }),
      );
  }

  logout() {
    localStorage.removeItem('authToken');
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
