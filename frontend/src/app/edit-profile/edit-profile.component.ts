import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import {
  UserService,
  User,
  UpdateProfileRequest,
} from '../services/user.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrl: './edit-profile.component.css',
})
export class EditProfileComponent implements OnInit {
  user: User | null = null;
  loading = false;
  error = '';
  success = '';

  constructor(
    private auth: AuthService,
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.loading = true;
    this.error = '';

    const userId = this.auth.getCurrentUserId();
    if (!userId) {
      this.error = 'Unable to get user ID from token';
      this.loading = false;
      return;
    }

    this.userService.getUserProfile(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load profile';
        this.loading = false;
        console.error('Load profile error:', err);
      },
    });
  }

  submit() {
    if (!this.user) return;

    this.loading = true;
    this.error = '';
    this.success = '';

    const payload: UpdateProfileRequest = {
      username: this.user.username,
      email: this.user.email,
    };

    this.userService.updateUserProfile(this.user._id, payload).subscribe({
      next: (response) => {
        this.success = 'Profile updated successfully!';
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to update profile';
        this.loading = false;
        console.error('Update profile error:', err);
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
