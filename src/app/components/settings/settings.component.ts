import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  standalone: false,
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  
  constructor(
    private router: Router,
    public authService: AuthService
  ) {}
  
  get isBreeder(): boolean {
    return this.authService.isBreeder;
  }
  
  navigateToSection(section: 'general' | 'breedery' | 'locations' | 'messages' | 'notifications'): void {
    this.router.navigate(['/settings', section]);
  }
  
  isActive(section: string): boolean {
    return this.router.url.includes(`/settings/${section}`);
  }
}
