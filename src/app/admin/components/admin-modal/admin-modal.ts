import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './admin-modal.html',
  styleUrl: './admin-modal.css'
})
export class AdminModal {
  @Input() title = '';
  @Output() close = new EventEmitter<void>();
}
