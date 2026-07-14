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
import { AlertStateService, IrrigationAlert } from '../../services/alert-state.service';

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

  unreadCount = 0;
  recentNotifications: IrrigationAlert[] = [];

  readonly languages = [
    { code: 'fr', labelKey: 'LANGUAGE.FR', short: 'FR', flag: 'FR', locale: 'fr-FR', dir: 'ltr' },
    { code: 'en', labelKey: 'LANGUAGE.EN', short: 'EN', flag: 'EN', locale: 'en-US', dir: 'ltr' },
    { code: 'ar', labelKey: 'LANGUAGE.AR', short: 'AR', flag: 'AR', locale: 'ar-MA', dir: 'rtl' }
  ];

  selectedLanguage = this.languages[0];

  private readonly routeTitles: Record<string, string> = {
    '/dashboard': 'NAV.DASHBOARD',
    '/history': 'NAV.HISTORY',
    '/analyses': 'NAV.ANALYSES',
    '/alerts': 'NAV.ALERTS',
    '/pump-control': 'NAV.PUMP_CONTROL',
    '/settings': 'NAV.SETTINGS',
    '/about': 'NAV.ABOUT'
  };

  private routerSub?: Subscription;
  private profileSub?: Subscription;
  private unreadSub?: Subscription;
  private recentSub?: Subscription;

  constructor(
    private router: Router,
    private translate: TranslateService,
    private authService: AuthService,
    readonly alertState: AlertStateService,
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

    this.unreadSub = this.alertState.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });

    this.recentSub = this.alertState.recentAlerts$.subscribe(alerts => {
      this.recentNotifications = alerts;
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
    this.profileSub?.unsubscribe();
    this.unreadSub?.unsubscribe();
    this.recentSub?.unsubscribe();
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
    this.router.navigate(['/']);
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
