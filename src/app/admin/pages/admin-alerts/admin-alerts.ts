import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../services/admin-api.service';
import { AdminToastService } from '../../services/admin-toast.service';
import { AdminAlert } from '../../models/admin-alert';
import { AdminConfirmDialog } from '../../components/admin-confirm-dialog/admin-confirm-dialog';

@Component({
  selector: 'app-admin-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AdminConfirmDialog],
  templateUrl: './admin-alerts.html',
  styleUrl: './admin-alerts.css'
})
export class AdminAlerts implements OnInit {
  alerts: AdminAlert[] = [];
  searchTerm = '';
  severityFilter = '';
  typeFilter = '';
  isLoading = false;
  errorMessage = '';

  pageSize = 10;
  currentPage = 1;
  readonly pageSizeOptions = [5, 10, 20, 50];

  deleteOlderThanDays = 90;
  showDeleteOldConfirm = false;
  isDeleting = false;

  constructor(private adminApi: AdminApiService, private toast: AdminToastService) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  get alertTypes(): string[] {
    return Array.from(new Set(this.alerts.map((alert) => alert.alertType))).sort();
  }

  get filteredAlerts(): AdminAlert[] {
    return this.alerts.filter((alert) => !this.typeFilter || alert.alertType === this.typeFilter);
  }

  get paginatedAlerts(): AdminAlert[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredAlerts.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredAlerts.length / this.pageSize));
  }

  get pageStart(): number {
    return this.filteredAlerts.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredAlerts.length);
  }

  applyFilters(): void {
    this.currentPage = 1;
    this.loadAlerts();
  }

  onTypeFilterChange(): void {
    this.currentPage = 1;
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  previousPage(): void {
    this.currentPage = Math.max(1, this.currentPage - 1);
  }

  nextPage(): void {
    this.currentPage = Math.min(this.totalPages, this.currentPage + 1);
  }

  openDeleteOldConfirm(): void {
    this.showDeleteOldConfirm = true;
  }

  cancelDeleteOld(): void {
    this.showDeleteOldConfirm = false;
  }

  confirmDeleteOld(): void {
    this.showDeleteOldConfirm = false;
    this.isDeleting = true;

    this.adminApi
      .deleteAlertsOlderThan(this.deleteOlderThanDays)
      .pipe(finalize(() => (this.isDeleting = false)))
      .subscribe({
        next: (res) => {
          this.toast.success(`${res.deletedCount} old resolved alert(s) deleted.`);
          this.loadAlerts();
        },
        error: () => this.toast.error('Unable to delete old alerts. Please try again.')
      });
  }

  private loadAlerts(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi
      .getAlerts({
        severity: this.severityFilter || undefined,
        search: this.searchTerm.trim() || undefined
      })
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (alerts) => (this.alerts = alerts),
        error: () => (this.errorMessage = 'Unable to load alerts.')
      });
  }
}
