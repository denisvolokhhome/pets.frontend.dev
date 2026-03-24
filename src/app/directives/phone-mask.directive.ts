import { Directive, ElementRef, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directive that formats phone input as (XXX) XXX-XXXX.
 * Strips non-digit characters, applies US phone mask,
 * and updates the form control value with the formatted string.
 */
@Directive({
  standalone: false,
  selector: '[appPhoneMask]'
})
export class PhoneMaskDirective {
  constructor(private el: ElementRef<HTMLInputElement>, private control: NgControl) {}

  @HostListener('input')
  onInput(): void {
    const raw = this.el.nativeElement.value.replace(/\D/g, '').substring(0, 10);
    let formatted = '';

    if (raw.length > 6) {
      formatted = `(${raw.substring(0, 3)}) ${raw.substring(3, 6)}-${raw.substring(6)}`;
    } else if (raw.length > 3) {
      formatted = `(${raw.substring(0, 3)}) ${raw.substring(3)}`;
    } else if (raw.length > 0) {
      formatted = `(${raw}`;
    }

    this.el.nativeElement.value = formatted;
    this.control.control?.setValue(formatted, { emitEvent: false });
  }
}
