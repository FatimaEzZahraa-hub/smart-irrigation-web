import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-alerts',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css'
})
export class Alerts {
  alerts = [
    {
      message: 'ALERTS.LOW_SOIL_HUMIDITY',
      severity: 'warning'
    },
    {
      message: 'ALERTS.PUMP_ACTIVATED',
      severity: 'info'
    },
    {
      message: 'ALERTS.HIGH_TEMPERATURE',
      severity: 'critical'
    }
  ];
}
