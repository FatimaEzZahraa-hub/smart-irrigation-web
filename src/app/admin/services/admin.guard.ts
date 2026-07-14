import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AdminAuthService } from './admin-auth.service';

/**
 * Gates every route under the AdminLayout. Checks only the admin_token
 * (separate from the user app's "token" key) — never touches the regular
 * user authentication state.
 */
export const adminGuard: CanActivateFn = () => {
  const adminAuth = inject(AdminAuthService);
  const router = inject(Router);

  if (adminAuth.isLoggedIn()) {
    return true;
  }

  return router.parseUrl('/admin/login');
};
