import { Component } from '@angular/core';

/**
 * Legacy toast component - now using PrimeNG Toast
 * This component is kept for backward compatibility but is no longer used
 * All toast notifications now go through PrimeNG's p-toast component
 */
@Component({
  standalone: false,
  selector: 'app-toast',
  template: '<!-- Legacy component - using PrimeNG Toast instead -->',
  styles: []
})
export class ToastComponent {
  constructor() {}
}
