import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface User {
  _id: string;
  username: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileRequest {
  username?: string;
  email?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  private getAuthHeaders(): { Authorization: string } {
    const token = this.authService.getAccessToken();
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  getUserProfile(userId: string): Observable<User> {
    const headers = this.getAuthHeaders();
    return this.http.get<User>(`${this.baseUrl}users/${userId}`, { headers });
  }

  updateUserProfile(
    userId: string,
    payload: UpdateProfileRequest,
  ): Observable<UpdateProfileResponse> {
    const headers = this.getAuthHeaders();
    return this.http.put<UpdateProfileResponse>(
      `${this.baseUrl}users/${userId}`,
      payload,
      { headers },
    );
  }

  getUsers(
    page = 1,
    limit = 10,
  ): Observable<{ users: User[]; pagination: any }> {
    const headers = this.getAuthHeaders();
    return this.http.get<{ users: User[]; pagination: any }>(
      `${this.baseUrl}users?page=${page}&limit=${limit}`,
      { headers },
    );
  }
}
