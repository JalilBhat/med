import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent {
  username = '';
  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';

  showPassword = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.username = '';
    this.email = '';
    this.password = '';
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  submit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.auth
      .register({
        username: this.username,
        password: this.password,
        email: this.email,
      })
      .subscribe({
        next: () => {
          this.successMessage =
            'Registration successful. You are now logged in.';
          setTimeout(() => this.router.navigate(['/home']), 1200);
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Registration failed';
        },
      });
  }
}
