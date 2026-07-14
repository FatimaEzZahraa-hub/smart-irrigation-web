import { AfterViewInit, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

interface LandingFeature {
  icon: string;
  titleKey: string;
  descKey: string;
}

interface LandingStep {
  icon: string;
  titleKey: string;
  descKey: string;
}

interface LandingBenefit {
  icon: string;
  titleKey: string;
  descKey: string;
}

interface LandingStat {
  icon: string;
  target: number;
  decimals: number;
  suffix: string;
  labelKey: string;
  current: number;
}

interface LandingTestimonial {
  quoteKey: string;
  nameKey: string;
  roleKey: string;
  orgKey: string;
  initials: string;
  rating: number;
}

interface LandingComparisonRow {
  labelKey: string;
  manualKey: string;
  smartKey: string;
  manualPositive: boolean;
  smartPositive: boolean;
}

interface LandingFaq {
  qKey: string;
  aKey: string;
  open: boolean;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './landing.html',
  styleUrl: './landing.css'
})
export class Landing implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('statsAnchor') statsAnchor?: ElementRef<HTMLElement>;

  navScrolled = false;

  readonly features: LandingFeature[] = [
    { icon: 'dashboard', titleKey: 'LANDING.FEATURES.DASHBOARD.TITLE', descKey: 'LANDING.FEATURES.DASHBOARD.DESC' },
    { icon: 'sensors', titleKey: 'LANDING.FEATURES.MONITORING.TITLE', descKey: 'LANDING.FEATURES.MONITORING.DESC' },
    { icon: 'water_pump', titleKey: 'LANDING.FEATURES.AUTOMATION.TITLE', descKey: 'LANDING.FEATURES.AUTOMATION.DESC' },
    { icon: 'wb_sunny', titleKey: 'LANDING.FEATURES.WEATHER.TITLE', descKey: 'LANDING.FEATURES.WEATHER.DESC' },
    { icon: 'notifications_active', titleKey: 'LANDING.FEATURES.ALERTS.TITLE', descKey: 'LANDING.FEATURES.ALERTS.DESC' },
    { icon: 'insights', titleKey: 'LANDING.FEATURES.ANALYTICS.TITLE', descKey: 'LANDING.FEATURES.ANALYTICS.DESC' }
  ];

  readonly steps: LandingStep[] = [
    { icon: 'sensors', titleKey: 'LANDING.HOW.STEP1', descKey: 'LANDING.HOW.STEP1_DESC' },
    { icon: 'cloud_sync', titleKey: 'LANDING.HOW.STEP2', descKey: 'LANDING.HOW.STEP2_DESC' },
    { icon: 'psychology', titleKey: 'LANDING.HOW.STEP3', descKey: 'LANDING.HOW.STEP3_DESC' },
    { icon: 'water_pump', titleKey: 'LANDING.HOW.STEP4', descKey: 'LANDING.HOW.STEP4_DESC' },
    { icon: 'dashboard', titleKey: 'LANDING.HOW.STEP5', descKey: 'LANDING.HOW.STEP5_DESC' }
  ];

  activeStep = 0;

  readonly benefits: LandingBenefit[] = [
    { icon: 'water_drop', titleKey: 'LANDING.BENEFITS.WATER.TITLE', descKey: 'LANDING.BENEFITS.WATER.DESC' },
    { icon: 'monitor_heart', titleKey: 'LANDING.BENEFITS.MONITORING.TITLE', descKey: 'LANDING.BENEFITS.MONITORING.DESC' },
    { icon: 'auto_mode', titleKey: 'LANDING.BENEFITS.AUTOMATION.TITLE', descKey: 'LANDING.BENEFITS.AUTOMATION.DESC' },
    { icon: 'query_stats', titleKey: 'LANDING.BENEFITS.REPORTS.TITLE', descKey: 'LANDING.BENEFITS.REPORTS.DESC' }
  ];

  readonly stats: LandingStat[] = [
    { icon: 'water_drop', target: 30, decimals: 0, suffix: '%', labelKey: 'LANDING.STATS.WATER_SAVED', current: 0 },
    { icon: 'agriculture', target: 500, decimals: 0, suffix: '+', labelKey: 'LANDING.STATS.HECTARES', current: 0 },
    { icon: 'sensors', target: 99.9, decimals: 1, suffix: '%', labelKey: 'LANDING.STATS.UPTIME', current: 0 },
    { icon: 'support_agent', target: 24, decimals: 0, suffix: '/7', labelKey: 'LANDING.STATS.SUPPORT', current: 0 }
  ];

  readonly comparisonRows: LandingComparisonRow[] = [
    { labelKey: 'LANDING.COMPARISON.ROWS.MONITORING', manualKey: 'LANDING.COMPARISON.MANUAL.MANUAL_ROUNDS', smartKey: 'LANDING.COMPARISON.SMART.REAL_TIME', manualPositive: false, smartPositive: true },
    { labelKey: 'LANDING.COMPARISON.ROWS.WATER_USE', manualKey: 'LANDING.COMPARISON.MANUAL.OVERWATERING', smartKey: 'LANDING.COMPARISON.SMART.OPTIMIZED', manualPositive: false, smartPositive: true },
    { labelKey: 'LANDING.COMPARISON.ROWS.RESPONSE', manualKey: 'LANDING.COMPARISON.MANUAL.HOURS_DAYS', smartKey: 'LANDING.COMPARISON.SMART.INSTANT', manualPositive: false, smartPositive: true },
    { labelKey: 'LANDING.COMPARISON.ROWS.LABOR', manualKey: 'LANDING.COMPARISON.MANUAL.HIGH', smartKey: 'LANDING.COMPARISON.SMART.REDUCED', manualPositive: false, smartPositive: true },
    { labelKey: 'LANDING.COMPARISON.ROWS.DATA', manualKey: 'LANDING.COMPARISON.MANUAL.NONE', smartKey: 'LANDING.COMPARISON.SMART.HISTORY', manualPositive: false, smartPositive: true },
    { labelKey: 'LANDING.COMPARISON.ROWS.ALERTS', manualKey: 'LANDING.COMPARISON.MANUAL.NONE', smartKey: 'LANDING.COMPARISON.SMART.INSTANT_ALERTS', manualPositive: false, smartPositive: true },
    { labelKey: 'LANDING.COMPARISON.ROWS.REMOTE', manualKey: 'LANDING.COMPARISON.MANUAL.ON_SITE', smartKey: 'LANDING.COMPARISON.SMART.ANYWHERE', manualPositive: false, smartPositive: true }
  ];

  readonly testimonials: LandingTestimonial[] = [
    {
      quoteKey: 'LANDING.TESTIMONIALS.T1.QUOTE',
      nameKey: 'LANDING.TESTIMONIALS.T1.NAME',
      roleKey: 'LANDING.TESTIMONIALS.T1.ROLE',
      orgKey: 'LANDING.TESTIMONIALS.T1.ORG',
      initials: 'YM',
      rating: 5
    },
    {
      quoteKey: 'LANDING.TESTIMONIALS.T2.QUOTE',
      nameKey: 'LANDING.TESTIMONIALS.T2.NAME',
      roleKey: 'LANDING.TESTIMONIALS.T2.ROLE',
      orgKey: 'LANDING.TESTIMONIALS.T2.ORG',
      initials: 'SL',
      rating: 5
    },
    {
      quoteKey: 'LANDING.TESTIMONIALS.T3.QUOTE',
      nameKey: 'LANDING.TESTIMONIALS.T3.NAME',
      roleKey: 'LANDING.TESTIMONIALS.T3.ROLE',
      orgKey: 'LANDING.TESTIMONIALS.T3.ORG',
      initials: 'KB',
      rating: 5
    }
  ];

  readonly ratingStars = [1, 2, 3, 4, 5];

  faqs: LandingFaq[] = [
    { qKey: 'LANDING.FAQ.Q1.Q', aKey: 'LANDING.FAQ.Q1.A', open: true },
    { qKey: 'LANDING.FAQ.Q2.Q', aKey: 'LANDING.FAQ.Q2.A', open: false },
    { qKey: 'LANDING.FAQ.Q3.Q', aKey: 'LANDING.FAQ.Q3.A', open: false },
    { qKey: 'LANDING.FAQ.Q4.Q', aKey: 'LANDING.FAQ.Q4.A', open: false },
    { qKey: 'LANDING.FAQ.Q5.Q', aKey: 'LANDING.FAQ.Q5.A', open: false },
    { qKey: 'LANDING.FAQ.Q6.Q', aKey: 'LANDING.FAQ.Q6.A', open: false }
  ];

  readonly year = new Date().getFullYear();

  // ── Live mock sensor preview (fully client-side, no network calls) ──
  liveMoisture = 64;
  liveTemperature = 26.4;
  liveHumidity = 52;
  livePumpOn = false;
  livePumpJustToggled = false;
  readonly chartPoints: number[] = [58, 61, 59, 63, 66, 64, 68, 65, 69, 67, 70, 64];

  get soilStatusKey(): string {
    if (this.liveMoisture < 45) return 'DASHBOARD.SOIL.DRY';
    if (this.liveMoisture > 75) return 'DASHBOARD.SOIL.WET';
    return 'DASHBOARD.SOIL.OPTIMAL';
  }

  private liveTimer?: ReturnType<typeof setInterval>;
  private stepTimer?: ReturnType<typeof setInterval>;
  private countersStarted = false;
  private statsObserver?: IntersectionObserver;
  private revealObserver?: IntersectionObserver;

  ngOnInit(): void {
    this.liveTimer = setInterval(() => this.tickLiveMetrics(), 2600);
    this.stepTimer = setInterval(() => {
      this.activeStep = (this.activeStep + 1) % this.steps.length;
    }, 2200);
  }

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') {
      this.startCounters();
      return;
    }

    if (this.statsAnchor) {
      this.statsObserver = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.startCounters();
          this.statsObserver?.disconnect();
        }
      }, { threshold: 0.3 });
      this.statsObserver.observe(this.statsAnchor.nativeElement);
    }

    const revealTargets = document.querySelectorAll('.reveal');
    this.revealObserver = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          this.revealObserver?.unobserve(entry.target);
        }
      }
    }, { threshold: 0.12 });
    revealTargets.forEach((el) => this.revealObserver?.observe(el));
  }

  ngOnDestroy(): void {
    if (this.liveTimer) clearInterval(this.liveTimer);
    if (this.stepTimer) clearInterval(this.stepTimer);
    this.statsObserver?.disconnect();
    this.revealObserver?.disconnect();
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.navScrolled = window.scrollY > 12;
  }

  toggleFaq(item: LandingFaq): void {
    item.open = !item.open;
  }

  private startCounters(): void {
    if (this.countersStarted) return;
    this.countersStarted = true;

    const durationMs = 1400;
    const stepMs = 20;
    const steps = Math.round(durationMs / stepMs);

    let tick = 0;
    const interval = setInterval(() => {
      tick++;
      const progress = Math.min(1, tick / steps);
      const eased = 1 - Math.pow(1 - progress, 3);

      for (const stat of this.stats) {
        stat.current = Number((stat.target * eased).toFixed(stat.decimals));
      }

      if (progress >= 1) {
        clearInterval(interval);
      }
    }, stepMs);
  }

  private tickLiveMetrics(): void {
    this.liveMoisture = this.jitter(this.liveMoisture, 58, 72, 2.5);
    this.liveTemperature = Number(this.jitter(this.liveTemperature, 23, 29, 0.6).toFixed(1));
    this.liveHumidity = this.jitter(this.liveHumidity, 44, 62, 3);

    if (Math.random() < 0.18) {
      this.livePumpOn = !this.livePumpOn;
      this.livePumpJustToggled = true;
      setTimeout(() => (this.livePumpJustToggled = false), 900);
    }
  }

  private jitter(value: number, min: number, max: number, amount: number): number {
    const next = value + (Math.random() - 0.5) * amount * 2;
    return Math.min(max, Math.max(min, Math.round(next * 10) / 10));
  }

  chartPointsAttr(): string {
    const max = Math.max(...this.chartPoints);
    const min = Math.min(...this.chartPoints);
    const range = max - min || 1;
    const width = 280;
    const height = 90;
    const step = width / (this.chartPoints.length - 1);

    return this.chartPoints
      .map((point, index) => {
        const x = index * step;
        const y = height - ((point - min) / range) * height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }
}
