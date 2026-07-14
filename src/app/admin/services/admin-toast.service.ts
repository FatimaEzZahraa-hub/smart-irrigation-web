import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdminToast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminToastService {
  private nextId = 0;
  private readonly toastsSubject = new BehaviorSubject<AdminToast[]>([]);
  readonly toasts$ = this.toastsSubject.asObservable();

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  dismiss(id: number): void {
    this.toastsSubject.next(this.toastsSubject.value.filter((toast) => toast.id !== id));
  }

  private push(type: AdminToast['type'], message: string): void {
    const id = ++this.nextId;
    this.toastsSubject.next([...this.toastsSubject.value, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4000);
  }
}
