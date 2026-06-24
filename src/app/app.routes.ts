import { Routes } from '@angular/router';

import { Login } from './pages/login/login';
import { Signup } from './pages/signup/signup';
import { Dashboard } from './pages/dashboard/dashboard';
import { PumpControl } from './pages/pump-control/pump-control';
import { History } from './pages/history/history';
import { Alerts } from './pages/alerts/alerts';
import { Settings } from './pages/settings/settings';
import { MainLayout } from './layouts/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
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
        path: 'alerts',
        component: Alerts
      },
      {
        path: 'settings',
        component: Settings
      }
    ]
  }
];