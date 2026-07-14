import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { finalize, forkJoin } from 'rxjs';

import { AdminApiService } from '../../services/admin-api.service';
import { AdminToastService } from '../../services/admin-toast.service';
import { AdminDevice } from '../../models/admin-device';
import { AdminConfirmDialog } from '../../components/admin-confirm-dialog/admin-confirm-dialog';

@Component({
  selector: 'app-admin-devices',
  standalone: true,
  imports: [CommonModule, MatIconModule, AdminConfirmDialog],
  templateUrl: './admin-devices.html',
  styleUrl: './admin-devices.css'
})
export class AdminDevices implements OnInit {
  devices: AdminDevice[] = [];
  ownerNames: Record<string, string> = {};
  isLoading = false;
  errorMessage = '';

  pendingDevice: AdminDevice | null = null;

  constructor(private adminApi: AdminApiService, private toast: AdminToastService) {}

  ngOnInit(): void {
    this.loadDevices();
  }

  ownerName(userId: string): string {
    return this.ownerNames[userId] || 'Unknown';
  }

  requestToggle(device: AdminDevice): void {
    this.pendingDevice = device;
  }

  cancelToggle(): void {
    this.pendingDevice = null;
  }

  confirmToggle(): void {
    const device = this.pendingDevice;
    this.pendingDevice = null;

    if (!device) {
      return;
    }

    const action = device.active
      ? this.adminApi.deactivateDevice(device.id)
      : this.adminApi.activateDevice(device.id);

    action.subscribe({
      next: (updated) => {
        this.devices = this.devices.map((item) => (item.id === updated.id ? updated : item));
        this.toast.success(`${updated.name} was ${updated.active ? 'activated' : 'deactivated'}.`);
      },
      error: () => this.toast.error('Unable to update this device. Please try again.')
    });
  }

  private loadDevices(): void {
    this.isLoading = true;
    this.errorMessage = '';

    forkJoin({
      devices: this.adminApi.getDevices(),
      users: this.adminApi.getUsers()
    })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: ({ devices, users }) => {
          this.devices = devices;
          this.ownerNames = Object.fromEntries(users.map((user) => [user.id, user.username]));
        },
        error: () => (this.errorMessage = 'Unable to load devices.')
      });
  }
}
