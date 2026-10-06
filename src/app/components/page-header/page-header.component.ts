import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface PageHeaderConfig {
  title: string;
  icon: string;
  iconColor?: string;
  showLayoutSwitcher?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  showActionButton?: boolean;
  actionButtonIcon?: string;
  actionButtonColor?: string;
  actionButtonTitle?: string;
  actionButtonDisabled?: boolean;
  actionButtonTooltip?: string;
}

@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './page-header.component.html',
  styleUrls: ['./page-header.component.css']
})
export class PageHeaderComponent {
  @Input() config!: PageHeaderConfig;
  /** Use 2 when the header is embedded in a page that already has its own h1. */
  @Input() headingLevel: 1 | 2 = 1;
  @Input() currentLayout: 'table' | 'cards' = 'table';
  @Input() searchTerm: string = '';
  
  @Output() layoutChange = new EventEmitter<'table' | 'cards'>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() actionButtonClick = new EventEmitter<void>();
  
  onLayoutChange(layout: 'table' | 'cards') {
    this.layoutChange.emit(layout);
  }
  
  onSearchChange(value: string) {
    this.searchChange.emit(value);
  }
  
  clearSearch() {
    this.searchTerm = '';
    this.searchChange.emit('');
  }
  
  onActionClick() {
    this.actionButtonClick.emit();
  }
}
