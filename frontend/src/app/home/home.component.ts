import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  isLoggedIn = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.isLoggedIn = this.auth.isLoggedIn();
    if (!this.isLoggedIn) {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
