import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { AuthService, CurrentUser } from '../../services/auth.service';

export type SettingsTab = 'profile' | 'security' | 'language';

interface ProfileForm {
  fullName: string;
  email: string;
}

interface SecurityForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.css'
})
export class Settings implements OnInit {
  activeTab: SettingsTab = 'profile';

  user?: CurrentUser;
  isLoadingProfile = false;
  profileError = '';

  profileForm: ProfileForm = { fullName: '', email: '' };
  securityForm: SecurityForm = { currentPassword: '', newPassword: '', confirmPassword: '' };

  profileSaving = false;
  profileSaved = false;
  profileSaveError = '';

  securitySaving = false;
  securitySaved = false;
  securityError = '';
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  languageSaving = false;
  languageSaved = false;
  selectedLanguage = 'fr';

  readonly languages = [
    { code: 'en', label: 'English',   icon: 'language' },
    { code: 'fr', label: 'Français',  icon: 'language' },
    { code: 'ar', label: 'العربية',   icon: 'language' }
  ];

  constructor(
    private authService: AuthService,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('smart-irrigation-language');
    if (saved && this.languages.some(l => l.code === saved)) {
      this.selectedLanguage = saved;
    }
    this.loadProfile();
  }

  setTab(tab: SettingsTab): void {
    this.activeTab = tab;
  }

  // ── Profile ────────────────────────────────────────────────
  private loadProfile(): void {
    this.isLoadingProfile = true;
    this.profileError = '';

    this.authService.profile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.fullName = user.fullName || '';
        this.profileForm.email = user.email || '';
        this.isLoadingProfile = false;
      },
      error: () => {
        this.profileError = 'PROFILE.ERROR';
        this.isLoadingProfile = false;
      }
    });
  }

  saveProfile(): void {
    this.profileSaving = true;
    this.profileSaved = false;
    this.profileSaveError = '';

    // Ready for future backend integration (PUT /auth/profile)
    setTimeout(() => {
      this.profileSaving = false;
      this.profileSaved = true;
      setTimeout(() => (this.profileSaved = false), 3000);
    }, 800);
  }

  // ── Security ───────────────────────────────────────────────
  get passwordsMatch(): boolean {
    return this.securityForm.newPassword === this.securityForm.confirmPassword;
  }

  get securityFormValid(): boolean {
    return (
      !!this.securityForm.currentPassword &&
      this.securityForm.newPassword.length >= 8 &&
      this.passwordsMatch
    );
  }

  savePassword(): void {
    if (!this.securityFormValid || this.securitySaving) return;
    this.securitySaving = true;
    this.securitySaved = false;
    this.securityError = '';

    this.authService.changePassword({
      currentPassword: this.securityForm.currentPassword,
      newPassword: this.securityForm.newPassword
    }).subscribe({
      next: () => {
        this.securitySaving = false;
        this.securitySaved = true;
        this.securityForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => (this.securitySaved = false), 3000);
      },
      error: (err) => {
        this.securitySaving = false;
        this.securityError = this.getPasswordErrorMessage(err);
      }
    });
  }

  private getPasswordErrorMessage(err: any): string {
    if (err?.status === 401) {
      return 'SETTINGS.ERROR_WRONG_PASSWORD';
    }

    if (err?.status === 400) {
      return 'SETTINGS.ERROR_INVALID_PASSWORD';
    }

    if (err?.status === 0 || (err?.status && err.status >= 500)) {
      return 'SETTINGS.ERROR_SERVER';
    }

    return 'SETTINGS.ERROR_GENERIC';
  }

  // ── Language ───────────────────────────────────────────────
  saveLanguage(): void {
    this.languageSaving = true;
    this.languageSaved = false;

    this.translate.use(this.selectedLanguage);
    localStorage.setItem('smart-irrigation-language', this.selectedLanguage);
    this.document.documentElement.lang = this.selectedLanguage;
    this.document.documentElement.dir = this.selectedLanguage === 'ar' ? 'rtl' : 'ltr';

    setTimeout(() => {
      this.languageSaving = false;
      this.languageSaved = true;
      setTimeout(() => (this.languageSaved = false), 3000);
    }, 400);
  }
}
