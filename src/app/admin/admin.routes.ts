import { Routes } from '@angular/router';

import { adminGuard } from './services/admin.guard';

/**
 * Lazily loaded from app.routes.ts under path 'admin'. Entirely self
 * contained: its own layout, its own guard (admin_token), its own pages —
 * nothing here is shared with the user-facing routes in app.routes.ts.
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/admin-login/admin-login').then((m) => m.AdminLogin)
  },
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then((m) => m.AdminLayout),
    canActivate: [adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/admin-dashboard/admin-dashboard').then((m) => m.AdminDashboard)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/admin-users/admin-users').then((m) => m.AdminUsers)
      },
      {
        path: 'devices',
        loadComponent: () => import('./pages/admin-devices/admin-devices').then((m) => m.AdminDevices)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./pages/admin-alerts/admin-alerts').then((m) => m.AdminAlerts)
      }
    ]
  }
];
