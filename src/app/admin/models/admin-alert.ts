export interface AdminAlert {
  id: string;
  deviceId: string;
  alertType: string;
  message: string;
  severity: 'info' | 'warning' | 'critical' | string;
  resolved: boolean;
  resolvedAt: string | null;
  createdAt: string;
}
