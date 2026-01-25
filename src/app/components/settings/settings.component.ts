import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  
  constructor(private router: Router) {}
  
  navigateToSection(section: 'general' | 'locations'): void {
    this.router.navigate(['/settings', section]);
  }
  
  isActive(section: string): boolean {
    return this.router.url.includes(`/settings/${section}`);
  }
}
