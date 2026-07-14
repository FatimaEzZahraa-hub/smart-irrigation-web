import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  form: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        username: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]]
      },
      {
        validators: this.passwordsMatchValidator
      }
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = this.getFormErrorMessage();
      return;
    }

    if (this.isLoading) {
      return;
    }

    const { username, email, password } = this.form.value;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.auth.register({
      username: username.trim(),
      email: email.trim(),
      password
    }).subscribe({
      next: () => {
        this.successMessage = 'AUTH.SIGNUP.SUCCESS';
        this.form.reset();
        this.isLoading = false;
        setTimeout(() => this.router.navigate(['/login']), 1200);
      },
      error: (err) => {
        this.errorMessage = this.getServerErrorMessage(err);
        this.isLoading = false;
      }
    });
  }

  private passwordsMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  private getFormErrorMessage(): string {
    if (this.form.hasError('passwordMismatch')) {
      return 'AUTH.SIGNUP.ERROR.PASSWORD_MISMATCH';
    }

    if (this.form.get('username')?.hasError('required')) {
      return 'AUTH.SIGNUP.ERROR.USERNAME_REQUIRED';
    }

    if (this.form.get('email')?.hasError('required')) {
      return 'AUTH.SIGNUP.ERROR.EMAIL_REQUIRED';
    }

    if (this.form.get('email')?.hasError('email')) {
      return 'AUTH.SIGNUP.ERROR.EMAIL_INVALID';
    }

    if (this.form.get('password')?.hasError('required')) {
      return 'AUTH.SIGNUP.ERROR.PASSWORD_REQUIRED';
    }

    if (this.form.get('password')?.hasError('minlength')) {
      return 'AUTH.SIGNUP.ERROR.PASSWORD_MIN';
    }

    return 'AUTH.SIGNUP.ERROR.FORM_INVALID';
  }

  private getServerErrorMessage(err: any): string {
    if (err?.status === 400) {
      return 'AUTH.SIGNUP.ERROR.MISSING_FIELDS';
    }

    if (err?.status === 409 || err?.status === 422) {
      return 'AUTH.SIGNUP.ERROR.EMAIL_USED';
    }

    if (err?.status === 0 || (err?.status && err.status >= 500)) {
      return 'AUTH.SIGNUP.ERROR.SERVER';
    }

    return err?.error?.message || 'AUTH.SIGNUP.ERROR.SERVER';
  }
}
