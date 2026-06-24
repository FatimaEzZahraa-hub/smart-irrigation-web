import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DOCUMENT } from '@angular/common';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterOutlet } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

import { Sidebar } from '../../components/sidebar/sidebar';
import { AuthService, CurrentUser } from '../../services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    MatBadgeModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    TranslatePipe,
    Sidebar
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayout implements OnInit, OnDestroy {
  @ViewChild('notificationsMenuTrigger') private notificationsMenuTrigger?: MatMenuTrigger;
  @ViewChild('profileMenuTrigger') private profileMenuTrigger?: MatMenuTrigger;

  currentTitle = 'NAV.DASHBOARD';
  sidebarCollapsed = false;
  currentDate = '';
  currentUser?: CurrentUser;
  profileLoading = false;

  readonly notifications = [
    {
      titleKey: 'ALERTS.LOW_SOIL_HUMIDITY',
      timeKey: 'NOTIFICATIONS.TIME_5_MIN',
      icon: 'warning',
      type: 'warning'
    },
    {
      titleKey: 'ALERTS.PUMP_ACTIVATED',
      timeKey: 'NOTIFICATIONS.TIME_18_MIN',
      icon: 'water_drop',
      type: 'info'
    },
    {
      titleKey: 'ALERTS.HIGH_TEMPERATURE',
      timeKey: 'NOTIFICATIONS.TIME_1_HOUR',
      icon: 'device_thermostat',
      type: 'critical'
    }
  ];

  readonly maxNotifications = 5;

  readonly languages = [
    { code: 'fr', labelKey: 'LANGUAGE.FR', short: 'FR', flag: 'FR', locale: 'fr-FR', dir: 'ltr' },
    { code: 'en', labelKey: 'LANGUAGE.EN', short: 'EN', flag: 'EN', locale: 'en-US', dir: 'ltr' },
    { code: 'ar', labelKey: 'LANGUAGE.AR', short: 'AR', flag: 'AR', locale: 'ar-MA', dir: 'rtl' }
  ];

  selectedLanguage = this.languages[0];

  get recentNotifications() {
    return this.notifications.slice(0, this.maxNotifications);
  }

  get notificationCount(): number {
    return this.notifications.length;
  }

  private readonly routeTitles: Record<string, string> = {
    '/dashboard': 'NAV.DASHBOARD',
    '/history': 'NAV.HISTORY',
    '/alerts': 'NAV.ALERTS',
    '/pump-control': 'NAV.PUMP_CONTROL',
    '/settings': 'NAV.SETTINGS'
  };

  private routerSub?: Subscription;
  private profileSub?: Subscription;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    const savedLanguage = this.getSavedLanguage();
    this.translate.addLangs(this.languages.map((language) => language.code));
    this.translate.setFallbackLang('fr');
    this.changeLanguage(savedLanguage, false);

    this.currentTitle = this.getTitleFromUrl(this.router.url);
    this.loadCurrentUser();

    this.routerSub = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.closeNotificationsMenu();
        this.closeProfileMenu();
      }

      if (event instanceof NavigationEnd) {
        this.currentTitle = this.getTitleFromUrl(event.urlAfterRedirects || event.url);
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }

  get userInitials(): string {
    const source = this.currentUser?.fullName || this.currentUser?.email || 'A';
    return source
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  onSidebarCollapsedChange(collapsed: boolean): void {
    this.sidebarCollapsed = collapsed;
  }

  closeNotificationsMenu(): void {
    this.notificationsMenuTrigger?.closeMenu();
  }

  closeProfileMenu(): void {
    this.profileMenuTrigger?.closeMenu();
  }

  goToSettings(): void {
    this.closeProfileMenu();
    this.router.navigate(['/settings']);
  }

  logout(): void {
    this.authService.logout();
    this.closeProfileMenu();
    this.router.navigate(['/login']);
  }

  changeLanguage(languageCode: string, persist = true): void {
    const language = this.languages.find((item) => item.code === languageCode) ?? this.languages[0];

    this.selectedLanguage = language;
    this.translate.use(language.code);
    this.currentDate = this.formatDate(language.locale);
    this.document.documentElement.lang = language.code;
    this.document.documentElement.dir = language.dir;

    if (persist) {
      localStorage.setItem('smart-irrigation-language', language.code);
    }
  }

  private getSavedLanguage(): string {
    const savedLanguage = localStorage.getItem('smart-irrigation-language');
    return this.languages.some((language) => language.code === savedLanguage) ? savedLanguage! : 'fr';
  }

  private loadCurrentUser(): void {
    if (!this.authService.getToken()) {
      return;
    }

    this.profileLoading = true;
    this.profileSub = this.authService.profile().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.profileLoading = false;
      },
      error: (err) => {
        this.profileLoading = false;

        if (err?.status === 401 || err?.status === 403) {
          this.logout();
        }
      }
    });
  }

  private formatDate(locale: string): string {
    return new Date().toLocaleDateString(locale, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  private getTitleFromUrl(url: string): string {
    const normalized = url.split('?')[0].split('#')[0];
    return this.routeTitles[normalized] || 'LAYOUT.OVERVIEW';
  }
}
