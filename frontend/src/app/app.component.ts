import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { LoaderComponent } from './loader/loader.component';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'frontend';
  isRefreshing$: Observable<boolean>;

  constructor(private authService: AuthService) {
    this.isRefreshing$ = this.authService.isRefreshing$();
  }

  ngOnInit() {}
}
