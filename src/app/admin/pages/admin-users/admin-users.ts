import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs';

import { AdminApiService } from '../../services/admin-api.service';
import { AdminToastService } from '../../services/admin-toast.service';
import { AdminUser } from '../../models/admin-user';
import { AdminModal } from '../../components/admin-modal/admin-modal';
import { AdminConfirmDialog } from '../../components/admin-confirm-dialog/admin-confirm-dialog';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, AdminModal, AdminConfirmDialog],
  templateUrl: './admin-users.html',
  styleUrl: './admin-users.css'
})
export class AdminUsers implements OnInit {
  users: AdminUser[] = [];
  searchTerm = '';
  isLoading = false;
  errorMessage = '';

  pageSize = 10;
  currentPage = 1;
  readonly pageSizeOptions = [5, 10, 20, 50];

  selectedUser: AdminUser | null = null;
  pendingToggleUser: AdminUser | null = null;

  constructor(private adminApi: AdminApiService, private toast: AdminToastService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  get filteredUsers(): AdminUser[] {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      return this.users;
    }

    return this.users.filter(
      (user) => user.email.toLowerCase().includes(term) || user.username.toLowerCase().includes(term)
    );
  }

  get paginatedUsers(): AdminUser[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.pageSize));
  }

  get pageStart(): number {
    return this.filteredUsers.length ? (this.currentPage - 1) * this.pageSize + 1 : 0;
  }

  get pageEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredUsers.length);
  }

  onSearchChange(): void {
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

  viewDetails(user: AdminUser): void {
    this.selectedUser = user;
  }

  closeDetails(): void {
    this.selectedUser = null;
  }

  requestToggle(user: AdminUser): void {
    this.pendingToggleUser = user;
  }

  cancelToggle(): void {
    this.pendingToggleUser = null;
  }

  confirmToggle(): void {
    const user = this.pendingToggleUser;
    this.pendingToggleUser = null;

    if (!user) {
      return;
    }

    const action = user.active ? this.adminApi.disableUser(user.id) : this.adminApi.enableUser(user.id);

    action.subscribe({
      next: (updated) => {
        this.users = this.users.map((item) => (item.id === updated.id ? updated : item));
        this.toast.success(`${updated.username} was ${updated.active ? 'enabled' : 'disabled'}.`);
      },
      error: () => this.toast.error('Unable to update this user. Please try again.')
    });
  }

  private loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.adminApi
      .getUsers()
      .pipe(finalize(() => (this.isLoading = false)))
      .subscribe({
        next: (users) => (this.users = users),
        error: () => (this.errorMessage = 'Unable to load users.')
      });
  }
}
