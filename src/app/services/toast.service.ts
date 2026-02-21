import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

/**
 * Toast service wrapper for PrimeNG MessageService
 * Provides a simpler API similar to ngx-toastr for easier migration
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private messageService: MessageService) {}

  success(detail: string, summary: string = 'Success', options?: any): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life: options?.timeOut || 5000
    });
  }

  error(detail: string, summary: string = 'Error', options?: any): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life: options?.timeOut || 5000
    });
  }

  warning(detail: string, summary: string = 'Warning', options?: any): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life: options?.timeOut || 5000
    });
  }

  info(detail: string, summary: string = 'Info', options?: any): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life: options?.timeOut || 5000
    });
  }

  clear(): void {
    this.messageService.clear();
  }
}
