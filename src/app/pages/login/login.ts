import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslatePipe],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  form: FormGroup;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'AUTH.LOGIN.ERROR.REQUIRED';
      return;
    }

    if (this.isLoading) {
      return;
    }

    const email = this.form.value.email?.trim();
    const password = this.form.value.password;

    if (!email || !password) {
      this.errorMessage = 'AUTH.LOGIN.ERROR.REQUIRED';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.auth.login({
      email,
      mot_de_passe: password
    }).subscribe({
      next: (res: any) => {
        const token = res?.token || res?.accessToken;

        if (token) {
          localStorage.setItem('token', token);
        }

        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Login error:', err);
        this.errorMessage = this.getErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err?.status === 401 || err?.status === 403) {
      return 'AUTH.LOGIN.ERROR.INVALID_CREDENTIALS';
    }

    if (err?.status === 404) {
      return 'AUTH.LOGIN.ERROR.USER_NOT_FOUND';
    }

    if (err?.status === 0 || (err?.status && err.status >= 500)) {
      return 'AUTH.LOGIN.ERROR.SERVER_UNAVAILABLE';
    }

    return err?.error?.message || 'AUTH.LOGIN.ERROR.INVALID_CREDENTIALS';
  }
}
