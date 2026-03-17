import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { IUser } from '../../models/user';
import { ILocation } from '../../models/location';
import { IPet } from '../../models/pet';

export type HelpState =
  | 'no-profile-no-locations'
  | 'has-profile-no-locations'
  | 'has-locations-no-profile'
  | 'ready-no-pets'
  | 'all-good'
  | 'loading';

export interface HelpMessage {
  icon: string;
  iconColor: string;
  title: string;
  body: string;
  actionLabel?: string;
  actionRoute?: string;
  actionFragment?: string;
  secondaryLabel?: string;
  secondaryRoute?: string;
  secondaryFragment?: string;
}

@Component({
  selector: 'app-breeder-help-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './breeder-help-widget.component.html',
  styleUrls: ['./breeder-help-widget.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreederHelpWidgetComponent implements OnInit, OnDestroy {
  isOpen = false;
  helpState: HelpState = 'loading';
  helpMessage: HelpMessage | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (!this.authService.hasValidToken()) return;

    this.authService.isLoggedIn$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loggedIn => {
        if (loggedIn && this.authService.isBreeder) {
          this.loadState();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isBreeder(): boolean {
    return this.authService.isBreeder;
  }

  get isAuthenticated(): boolean {
    return this.authService.hasValidToken();
  }

  get showBadge(): boolean {
    return this.helpState !== 'all-good' && this.helpState !== 'loading';
  }

  toggleDropdown(): void {
    if (!this.isAuthenticated || !this.isBreeder) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.loadState();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
  }

  navigate(route?: string, fragment?: string): void {
    if (!route) return;
    this.closeDropdown();
    if (fragment) {
      this.router.navigate([route], { fragment });
    } else {
      this.router.navigate([route]);
    }
  }

  private loadState(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;

    forkJoin({
      profile: this.dataService.getCurrentUserProfile(),
      locations: this.dataService.getLocations(),
      pets: this.dataService.getPetsByBreeder(userId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ profile, locations, pets }) => {
          const profileComplete = this.isProfileComplete(profile);
          const hasLocations = locations && locations.length > 0;
          const hasPets = pets && pets.filter(p => !p.is_puppy).length > 0;

          if (!profileComplete && !hasLocations) {
            this.helpState = 'no-profile-no-locations';
          } else if (profileComplete && !hasLocations) {
            this.helpState = 'has-profile-no-locations';
          } else if (!profileComplete && hasLocations) {
            this.helpState = 'has-locations-no-profile';
          } else if (profileComplete && hasLocations && !hasPets) {
            this.helpState = 'ready-no-pets';
          } else {
            this.helpState = 'all-good';
          }

          this.helpMessage = this.getMessageForState(this.helpState);
          this.cdr.markForCheck();
        },
        error: () => {
          this.helpState = 'all-good';
          this.helpMessage = null;
          this.cdr.markForCheck();
        }
      });
  }

  private isProfileComplete(user: IUser): boolean {
    return !!(user.breedery_name && user.breedery_name.trim());
  }

  private getMessageForState(state: HelpState): HelpMessage | null {
    switch (state) {
      case 'no-profile-no-locations':
        return {
          icon: 'bi-rocket-takeoff',
          iconColor: '#f59e0b',
          title: 'Let\'s get you set up!',
          body: 'Before you can add pets and create breedings, you\'ll need to complete two quick steps: fill in your Breeder Profile and add at least one location.',
          actionLabel: 'Complete Your Breedery Information',
          actionRoute: '/settings/breedery',
          secondaryLabel: 'Add a Location',
          secondaryRoute: '/settings/locations'
        };
      case 'has-profile-no-locations':
        return {
          icon: 'bi-geo-alt',
          iconColor: '#3b82f6',
          title: 'Almost there — add a location',
          body: 'Your breeder profile looks great! Now add at least one breeding location so pet seekers can find you. It doesn\'t need to be published yet.',
          actionLabel: 'Add a Location',
          actionRoute: '/settings/locations'
        };
      case 'has-locations-no-profile':
        return {
          icon: 'bi-person-badge',
          iconColor: '#8b5cf6',
          title: 'Complete your breeder profile',
          body: 'You\'ve got a location set up — nice! Now head to Settings and fill in your breedery name and description so pet seekers can learn about you.',
          actionLabel: 'Complete Profile',
          actionRoute: '/settings/breedery'
        };
      case 'ready-no-pets':
        return {
          icon: 'bi-stars',
          iconColor: '#10b981',
          title: 'You\'re all set — time to add pets!',
          body: 'Your profile and locations are ready. Head over to the Pets page and add your first pet to start building your portfolio.',
          actionLabel: 'Go to Pets',
          actionRoute: '/pets'
        };
      case 'all-good':
        return {
          icon: 'bi-check-circle',
          iconColor: '#10b981',
          title: 'You\'re in great shape!',
          body: 'Your profile, locations, and pets are all set up. Keep doing what you\'re doing!',
        };
      default:
        return null;
    }
  }
}
