import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminModal } from '../admin-modal/admin-modal';

@Component({
  selector: 'app-admin-confirm-dialog',
  standalone: true,
  imports: [CommonModule, AdminModal],
  templateUrl: './admin-confirm-dialog.html',
  styleUrl: './admin-confirm-dialog.css'
})
export class AdminConfirmDialog {
  @Input() title = 'Please confirm';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() danger = false;
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();
}
