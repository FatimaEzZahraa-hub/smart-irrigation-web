import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

interface WorkflowStep {
  icon: string;
  titleKey: string;
  descKey: string;
}

interface FeatureCard {
  icon: string;
  titleKey: string;
  descKey: string;
  route: string;
}

interface ModePoint {
  textKey: string;
}

interface GuideStep {
  icon: string;
  titleKey: string;
  descKey: string;
}

interface FaqItem {
  qKey: string;
  aKey: string;
  open: boolean;
}

interface AboutTeamMember {
  nameKey: string;
  roleKey: string;
  descKey: string;
  initials: string;
  accent: string;
}

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './about.html',
  styleUrl: './about.css'
})
export class About {
  readonly userGuideUrl = 'assets/docs/USER_GUIDE.pdf';

  readonly workflowSteps: WorkflowStep[] = [
    { icon: 'sensors', titleKey: 'ABOUT.WORKFLOW.STEP1_TITLE', descKey: 'ABOUT.WORKFLOW.STEP1_DESC' },
    { icon: 'analytics', titleKey: 'ABOUT.WORKFLOW.STEP2_TITLE', descKey: 'ABOUT.WORKFLOW.STEP2_DESC' },
    { icon: 'fork_right', titleKey: 'ABOUT.WORKFLOW.STEP3_TITLE', descKey: 'ABOUT.WORKFLOW.STEP3_DESC' },
    { icon: 'water_pump', titleKey: 'ABOUT.WORKFLOW.STEP4_TITLE', descKey: 'ABOUT.WORKFLOW.STEP4_DESC' }
  ];

  readonly features: FeatureCard[] = [
    { icon: 'dashboard', titleKey: 'ABOUT.FEATURES.DASHBOARD_TITLE', descKey: 'ABOUT.FEATURES.DASHBOARD_DESC', route: '/dashboard' },
    { icon: 'sensors', titleKey: 'ABOUT.FEATURES.MONITORING_TITLE', descKey: 'ABOUT.FEATURES.MONITORING_DESC', route: '/dashboard' },
    { icon: 'water_pump', titleKey: 'ABOUT.FEATURES.PUMP_TITLE', descKey: 'ABOUT.FEATURES.PUMP_DESC', route: '/pump-control' },
    { icon: 'wb_sunny', titleKey: 'ABOUT.FEATURES.WEATHER_TITLE', descKey: 'ABOUT.FEATURES.WEATHER_DESC', route: '/dashboard' },
    { icon: 'notifications', titleKey: 'ABOUT.FEATURES.ALERTS_TITLE', descKey: 'ABOUT.FEATURES.ALERTS_DESC', route: '/alerts' },
    { icon: 'history', titleKey: 'ABOUT.FEATURES.HISTORY_TITLE', descKey: 'ABOUT.FEATURES.HISTORY_DESC', route: '/history' },
    { icon: 'insights', titleKey: 'ABOUT.FEATURES.ANALYTICS_TITLE', descKey: 'ABOUT.FEATURES.ANALYTICS_DESC', route: '/analyses' },
    { icon: 'settings', titleKey: 'ABOUT.FEATURES.SETTINGS_TITLE', descKey: 'ABOUT.FEATURES.SETTINGS_DESC', route: '/settings' },
    { icon: 'psychology', titleKey: 'ABOUT.FEATURES.AI_TITLE', descKey: 'ABOUT.FEATURES.AI_DESC', route: '/dashboard' }
  ];

  readonly automaticPoints: ModePoint[] = [
    { textKey: 'ABOUT.MODES.AUTO_POINT1' },
    { textKey: 'ABOUT.MODES.AUTO_POINT2' },
    { textKey: 'ABOUT.MODES.AUTO_POINT3' },
    { textKey: 'ABOUT.MODES.AUTO_POINT4' },
    { textKey: 'ABOUT.MODES.AUTO_POINT5' }
  ];

  readonly manualPoints: ModePoint[] = [
    { textKey: 'ABOUT.MODES.MANUAL_POINT1' },
    { textKey: 'ABOUT.MODES.MANUAL_POINT2' },
    { textKey: 'ABOUT.MODES.MANUAL_POINT3' }
  ];

  readonly guideSteps: GuideStep[] = [
    { icon: 'person_add', titleKey: 'ABOUT.GUIDE.STEP1_TITLE', descKey: 'ABOUT.GUIDE.STEP1_DESC' },
    { icon: 'developer_board', titleKey: 'ABOUT.GUIDE.STEP2_TITLE', descKey: 'ABOUT.GUIDE.STEP2_DESC' },
    { icon: 'tune', titleKey: 'ABOUT.GUIDE.STEP3_TITLE', descKey: 'ABOUT.GUIDE.STEP3_DESC' },
    { icon: 'sensors', titleKey: 'ABOUT.GUIDE.STEP4_TITLE', descKey: 'ABOUT.GUIDE.STEP4_DESC' },
    { icon: 'swap_horiz', titleKey: 'ABOUT.GUIDE.STEP5_TITLE', descKey: 'ABOUT.GUIDE.STEP5_DESC' },
    { icon: 'fact_check', titleKey: 'ABOUT.GUIDE.STEP6_TITLE', descKey: 'ABOUT.GUIDE.STEP6_DESC' },
    { icon: 'psychology', titleKey: 'ABOUT.GUIDE.STEP7_TITLE', descKey: 'ABOUT.GUIDE.STEP7_DESC' }
  ];

  faqs: FaqItem[] = [
    { qKey: 'ABOUT.FAQ.Q1', aKey: 'ABOUT.FAQ.A1', open: true },
    { qKey: 'ABOUT.FAQ.Q2', aKey: 'ABOUT.FAQ.A2', open: false },
    { qKey: 'ABOUT.FAQ.Q3', aKey: 'ABOUT.FAQ.A3', open: false },
    { qKey: 'ABOUT.FAQ.Q4', aKey: 'ABOUT.FAQ.A4', open: false },
    { qKey: 'ABOUT.FAQ.Q5', aKey: 'ABOUT.FAQ.A5', open: false },
    { qKey: 'ABOUT.FAQ.Q6', aKey: 'ABOUT.FAQ.A6', open: false }
  ];

  readonly team: AboutTeamMember[] = [
    {
      nameKey: 'ABOUT.TEAM.FATIMA.NAME',
      roleKey: 'ABOUT.TEAM.FATIMA.ROLE',
      descKey: 'ABOUT.TEAM.FATIMA.DESC',
      initials: 'FE',
      accent: '#2f6b4f'
    },
    {
      nameKey: 'ABOUT.TEAM.ASMA.NAME',
      roleKey: 'ABOUT.TEAM.ASMA.ROLE',
      descKey: 'ABOUT.TEAM.ASMA.DESC',
      initials: 'A',
      accent: '#0d9488'
    },
    {
      nameKey: 'ABOUT.TEAM.HAFSA.NAME',
      roleKey: 'ABOUT.TEAM.HAFSA.ROLE',
      descKey: 'ABOUT.TEAM.HAFSA.DESC',
      initials: 'H',
      accent: '#0284c7'
    }
  ];

  toggleFaq(item: FaqItem): void {
    item.open = !item.open;
  }

  scrollToWorkflow(): void {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
