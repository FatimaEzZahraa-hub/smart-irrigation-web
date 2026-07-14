export type AiRecommendationAction =
  | 'WATER_NOW'
  | 'DELAY_RAIN_EXPECTED'
  | 'NO_ACTION_NEEDED'
  | 'IRRIGATION_IN_PROGRESS'
  | 'MANUAL_CHECK_RECOMMENDED';

export interface AiRecommendationBasis {
  soilMoisture: number | null;
  humidityThreshold: number;
  temperature: number | null;
  pumpStatus: string | null;
  rainExpected: boolean;
  recentAlertsCount: number;
  dataWarnings: string[];
}

export interface AiRecommendation {
  deviceId: string;
  generatedAt: string;
  action: AiRecommendationAction;
  recommendation: string;
  explanation: string;
  confidence: number;
  estimatedIrrigationDurationMinutes: number;
  waterSavingAdvice: string;
  basis: AiRecommendationBasis;
}
