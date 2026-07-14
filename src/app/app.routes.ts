import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Dashboard } from './pages/dashboard/dashboard';
import { PumpControl } from './pages/pump-control/pump-control';
import { History } from './pages/history/history';
import { Alerts } from './pages/alerts/alerts';
import { Settings } from './pages/settings/settings';
import { Analyses } from './pages/analyses/analyses';
import { About } from './pages/about/about';
import { MainLayout } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
    pathMatch: 'full'
  },
  {
    path: 'login',
    component: Login
  },
  {
    path: 'signup',
    component: Signup
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        component: Dashboard
      },
      {
        path: 'pump-control',
        component: PumpControl
      },
      {
        path: 'history',
        component: History
      },
      {
        path: 'analyses',
        component: Analyses
      },
      {
        path: 'alerts',
        component: Alerts
      },
      {
        path: 'settings',
        component: Settings
      },
      {
        path: 'about',
        component: About
      }
    ]
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then((m) => m.ADMIN_ROUTES)
  }
];