import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environment/environment.prod';

interface User {
  _id: string;
  username: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

interface UsersResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.css'],
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  pagination: UsersResponse['pagination'] | null = null;
  loading = false;
  error = '';
  private baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUsers();
  }

  loadUsers(page = 1, limit = 10) {
    this.loading = true;
    this.error = '';

    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<UsersResponse>(`${this.baseUrl}users?page=${page}&limit=${limit}`, {
        headers,
      })
      .subscribe({
        next: (response) => {
          this.users = response.users;
          this.pagination = response.pagination;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load users';
          this.loading = false;
          console.error('Load users error:', err);
        },
      });
  }

  goToPage(page: number) {
    if (page >= 1 && page <= (this.pagination?.totalPages || 1)) {
      this.loadUsers(page);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
