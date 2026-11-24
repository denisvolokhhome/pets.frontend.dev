import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Red confirm button for destructive actions (delete, void, remove). */
  danger?: boolean;
}

interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/**
 * App-styled replacement for window.confirm().
 * Usage: `if (!(await this.confirmService.confirm({ title, message, danger: true }))) return;`
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly requestSubject = new BehaviorSubject<ConfirmRequest | null>(null);
  readonly request$ = this.requestSubject.asObservable();

  /** True while a confirm dialog is waiting for an answer (lets overlays ignore its Escape). */
  get isOpen(): boolean {
    return this.requestSubject.value !== null;
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    // Only one dialog at a time; a new request cancels a pending one.
    this.requestSubject.value?.resolve(false);
    return new Promise<boolean>(resolve => this.requestSubject.next({ ...options, resolve }));
  }

  /** Called by the dialog component. */
  answer(confirmed: boolean): void {
    const request = this.requestSubject.value;
    this.requestSubject.next(null);
    request?.resolve(confirmed);
  }
}
