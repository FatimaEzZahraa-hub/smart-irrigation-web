import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AiService } from '../../services/ai.service';
import { AiRecommendation, AiRecommendationAction } from '../../models/ai-recommendation';

type AiCardState = 'idle' | 'loading' | 'ready' | 'error';

const TONE_BY_ACTION: Record<AiRecommendationAction, string> = {
  WATER_NOW: 'attention',
  DELAY_RAIN_EXPECTED: 'neutral',
  NO_ACTION_NEEDED: 'good',
  IRRIGATION_IN_PROGRESS: 'active',
  MANUAL_CHECK_RECOMMENDED: 'critical'
};

const ICON_BY_ACTION: Record<AiRecommendationAction, string> = {
  WATER_NOW: 'water_drop',
  DELAY_RAIN_EXPECTED: 'umbrella',
  NO_ACTION_NEEDED: 'check_circle',
  IRRIGATION_IN_PROGRESS: 'water_pump',
  MANUAL_CHECK_RECOMMENDED: 'report_problem'
};

@Component({
  selector: 'app-ai-recommendation-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  templateUrl: './ai-recommendation-card.html',
  styleUrl: './ai-recommendation-card.css'
})
export class AiRecommendationCard implements OnChanges {
  @Input() deviceId = '';

  state: AiCardState = 'idle';
  recommendation: AiRecommendation | null = null;

  constructor(private aiService: AiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['deviceId']) {
      return;
    }

    if (!this.deviceId) {
      this.state = 'idle';
      this.recommendation = null;
      return;
    }

    this.load(this.deviceId);
  }

  get toneClass(): string {
    return this.recommendation ? (TONE_BY_ACTION[this.recommendation.action] ?? 'neutral') : 'neutral';
  }

  get actionIcon(): string {
    return this.recommendation ? (ICON_BY_ACTION[this.recommendation.action] ?? 'psychology') : 'psychology';
  }

  get confidenceValue(): number {
    const value = this.recommendation?.confidence;
    return typeof value === 'number' && Number.isFinite(value)
      ? Math.max(0, Math.min(100, value))
      : 0;
  }

  get durationLabel(): string {
    const minutes = this.recommendation?.estimatedIrrigationDurationMinutes;
    if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
      return '—';
    }
    return `${minutes} min`;
  }

  private load(deviceId: string): void {
    this.state = 'loading';
    this.recommendation = null;

    this.aiService.getRecommendation(deviceId).subscribe({
      next: (result) => {
        if (!this.isValidRecommendation(result)) {
          this.state = 'error';
          return;
        }
        this.recommendation = result;
        this.state = 'ready';
      },
      error: () => {
        this.recommendation = null;
        this.state = 'error';
      }
    });
  }

  private isValidRecommendation(value: AiRecommendation | null | undefined): value is AiRecommendation {
    return !!value
      && typeof value.recommendation === 'string' && value.recommendation.length > 0
      && typeof value.explanation === 'string' && value.explanation.length > 0
      && typeof value.confidence === 'number' && Number.isFinite(value.confidence);
  }
}
