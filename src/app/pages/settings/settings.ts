import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  mode = 'AUTO';
  user?: CurrentUser;
  isLoadingProfile = false;
  profileError = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  changeMode() {
    this.mode = this.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
  }

  private loadProfile(): void {
    this.isLoadingProfile = true;
    this.profileError = '';

    this.authService.profile().subscribe({
      next: (user) => {
        this.user = user;
        this.isLoadingProfile = false;
      },
      error: () => {
        this.profileError = 'PROFILE.ERROR';
        this.isLoadingProfile = false;
      }
    });
  }
}
