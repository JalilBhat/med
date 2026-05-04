import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, throwError } from 'rxjs';

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
  accessToken?: string;
  refreshToken?: string;
  token?: string;
  user?: {
    id: string;
    username: string;
    email?: string;
    createdAt: string;
  };
}

export interface RefreshTokenResponse {
  message: string;
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private baseUrl = environment.apiUrl;
  private isLoggedInSubject = new BehaviorSubject<boolean>(
    this.checkLoggedIn(),
  );

  constructor(private http: HttpClient) {
    this.startTokenRefreshTimer();
  }

  login(payload: LoginRequest) {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}users/login`, payload)
      .pipe(
        tap((response) => {
          if (response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
          }
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
          this.isLoggedInSubject.next(true);
          this.startTokenRefreshTimer();
        }),
      );
  }

  register(payload: RegisterRequest) {
    return this.http.post<AuthResponse>(
      `${this.baseUrl}users/register`,
      payload,
    );
  }

  logout(): Observable<any> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.getAccessToken()}`,
    });

    return this.http.post(`${this.baseUrl}users/logout`, {}, { headers }).pipe(
      tap(() => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.isLoggedInSubject.next(false);
      }),
      catchError((error) => {
        // Clear tokens even if logout fails
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        this.isLoggedInSubject.next(false);
        return throwError(() => error);
      }),
    );
  }

  refreshAccessToken(): Observable<RefreshTokenResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<RefreshTokenResponse>(`${this.baseUrl}users/refresh`, {
        refreshToken,
      })
      .pipe(
        tap((response) => {
          if (response.accessToken) {
            localStorage.setItem('accessToken', response.accessToken);
            this.startTokenRefreshTimer();
          }
        }),
        catchError((error) => {
          // If refresh fails, logout user
          this.logout().subscribe();
          return throwError(() => error);
        }),
      );
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken() && !!this.getRefreshToken();
  }

  isLoggedIn$(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();
  }

  private checkLoggedIn(): boolean {
    return (
      !!localStorage.getItem('accessToken') &&
      !!localStorage.getItem('refreshToken')
    );
  }

  getCurrentUserId(): string | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.id;
    } catch (e) {
      return null;
    }
  }

  getTokenExpiryTime(): number | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.exp ? decoded.exp * 1000 : null;
    } catch (e) {
      return null;
    }
  }

  private startTokenRefreshTimer(): void {
    const expiryTime = this.getTokenExpiryTime();
    if (!expiryTime) return;

    // Refresh token 1 minute before it expires (5 minutes - 1 minute = 4 minutes from now)
    const timeUntilRefresh = expiryTime - Date.now() - 60000;

    if (timeUntilRefresh > 0) {
      setTimeout(() => {
        if (this.isLoggedIn()) {
          this.refreshAccessToken().subscribe();
        }
      }, timeUntilRefresh);
    }
  }
}
