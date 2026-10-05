import { AfterViewChecked, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { ConfirmService } from 'src/app/services/confirm.service';

@Component({
  standalone: false,
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css'],
})
export class ConfirmDialogComponent implements AfterViewChecked {
  @ViewChild('cancelButton') cancelButton?: ElementRef<HTMLButtonElement>;
  private focused = false;

  constructor(public confirmService: ConfirmService) {}

  ngAfterViewChecked(): void {
    // Focus the safe choice when the dialog opens
    if (this.cancelButton && !this.focused) {
      this.cancelButton.nativeElement.focus();
      this.focused = true;
    } else if (!this.cancelButton) {
      this.focused = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.confirmService.answer(false);
  }
}
