import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ModalService {
  private modals = new Map<string, BehaviorSubject<boolean>>();

  getModalState(modalId: string): BehaviorSubject<boolean> {
    if (!this.modals.has(modalId)) {
      this.modals.set(modalId, new BehaviorSubject<boolean>(false));
    }
    return this.modals.get(modalId)!;
  }

  open(modalId: string = 'default') {
    this.getModalState(modalId).next(true);
  }

  close(modalId: string = 'default') {
    this.getModalState(modalId).next(false);
  }

  isOpen(modalId: string = 'default'): boolean {
    return this.getModalState(modalId).value;
  }

  // Legacy support for components using isVisible$
  isVisible$ = this.getModalState('default');

  constructor() {}
}
