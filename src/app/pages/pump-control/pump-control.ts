import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-pump-control',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TranslatePipe
  ],
  templateUrl: './pump-control.html',
  styleUrl: './pump-control.css'
})
export class PumpControl {
  status = 'OFF';

  turnOn() {
    this.status = 'ON';
  }

  turnOff() {
    this.status = 'OFF';
  }
}
