import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { catchError } from 'rxjs/internal/operators/catchError';
import { switchMap } from 'rxjs/internal/operators/switchMap';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  logout() {
    this.auth
      .logout()
      .pipe(
        switchMap(() => this.router.navigate(['/login'])),
        catchError(() => this.router.navigate(['/login'])),
      )
      .subscribe();
  }

  // logout() {
  //   this.auth.logout().subscribe({
  //     next: () => this.router.navigate(['/login']),
  //     error: () => this.router.navigate(['/login']),
  //   });
  // }
}
