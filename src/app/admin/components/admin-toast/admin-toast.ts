import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { AdminToastService } from '../../services/admin-toast.service';

@Component({
  selector: 'app-admin-toast',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './admin-toast.html',
  styleUrl: './admin-toast.css'
})
export class AdminToast {
  constructor(readonly toastService: AdminToastService) {}
}
