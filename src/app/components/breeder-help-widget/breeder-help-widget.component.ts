import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { IUser } from '../../models/user';
import { ILocation } from '../../models/location';
import { IPet } from '../../models/pet';

export interface SetupStep {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

@Component({
  selector: 'app-breeder-help-widget',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './breeder-help-widget.component.html',
  styleUrl: './breeder-help-widget.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreederHelpWidgetComponent implements OnInit, OnDestroy {
  isOpen = false;
  isLoading = true;
  allComplete = false;
  private destroy$ = new Subject<void>();

  // Setup steps
  steps: SetupStep[] = [
    { id: 'profile', label: 'Name your breedery', icon: 'bi-building', completed: false, active: false },
    { id: 'location', label: 'Add a location', icon: 'bi-geo-alt', completed: false, active: false },
    { id: 'pet', label: 'Add your first pet', icon: 'bi-heart', completed: false, active: false },
  ];

  // Inline forms
  activeStep: string | null = null;
  profileForm: FormGroup;
  locationForm: FormGroup;
  isSaving = false;

  usStates = [
    'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
    'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
    'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
    'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
    'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
    'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
    'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
    'Wisconsin','Wyoming','District of Columbia'
  ];

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private toastr: ToastService,
    private router: Router,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      breedery_name: ['', Validators.required],
      breedery_description: ['']
    });
    this.locationForm = this.fb.group({
      name: ['', Validators.required],
      address1: ['', Validators.required],
      address2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['United States', Validators.required],
      zipcode: ['', Validators.required],
      location_type: ['user']
    });
  }

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

  get completedCount(): number {
    return this.steps.filter(s => s.completed).length;
  }

  get totalSteps(): number {
    return this.steps.length;
  }

  get progressPercent(): number {
    return Math.round((this.completedCount / this.totalSteps) * 100);
  }

  get showBadge(): boolean {
    return !this.allComplete && !this.isLoading;
  }

  toggleDropdown(): void {
    if (!this.isAuthenticated || !this.isBreeder) return;
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.activeStep = null;
      this.loadState();
    }
  }

  closeDropdown(): void {
    this.isOpen = false;
    this.activeStep = null;
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    if (this.activeStep) {
      this.activeStep = null;
      this.cdr.markForCheck();
    } else if (this.isOpen) {
      this.closeDropdown();
    }
  }

  onStepClick(step: SetupStep): void {
    if (step.completed) return;

    if (step.id === 'pet') {
      // Navigate to pets page — no inline form for this one
      this.closeDropdown();
      this.router.navigate(['/pets']);
      return;
    }

    this.activeStep = this.activeStep === step.id ? null : step.id;
    this.cdr.markForCheck();
  }

  cancelInlineForm(): void {
    this.activeStep = null;
    this.cdr.markForCheck();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    const data = {
      breedery_name: this.profileForm.value.breedery_name,
      breedery_description: this.profileForm.value.breedery_description
    };

    this.dataService.updateUserProfile(data)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.activeStep = null;
          this.toastr.success('Breedery name saved', 'Success');
          this.loadState();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastr.error(err.error?.detail || 'Failed to save', 'Error');
          this.cdr.markForCheck();
        }
      });
  }

  saveLocation(): void {
    if (this.locationForm.invalid) {
      Object.keys(this.locationForm.controls).forEach(key => {
        this.locationForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isSaving = true;
    this.cdr.markForCheck();

    this.dataService.createLocation(this.locationForm.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.activeStep = null;
          this.locationForm.reset({ country: 'United States', location_type: 'user' });
          this.toastr.success('Location added', 'Success');
          this.loadState();
        },
        error: (err) => {
          this.isSaving = false;
          this.toastr.error(err.error?.detail || 'Failed to save location', 'Error');
          this.cdr.markForCheck();
        }
      });
  }

  dismissGuide(): void {
    this.closeDropdown();
  }

  private loadState(): void {
    const userId = this.authService.currentUser?.id;
    if (!userId) return;

    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      profile: this.dataService.getCurrentUserProfile(),
      locations: this.dataService.getLocations(),
      pets: this.dataService.getPetsByBreeder(userId)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ profile, locations, pets }) => {
          const hasProfile = !!(profile.breedery_name && profile.breedery_name.trim());
          const hasLocations = locations && locations.length > 0;
          const hasPets = pets && pets.filter(p => !p.is_puppy).length > 0;

          this.steps[0].completed = hasProfile;
          this.steps[1].completed = hasLocations;
          this.steps[2].completed = hasPets;

          this.allComplete = hasProfile && hasLocations && hasPets;

          // Pre-fill profile form if data exists
          if (profile.breedery_name) {
            this.profileForm.patchValue({
              breedery_name: profile.breedery_name,
              breedery_description: profile.breedery_description || ''
            });
          }

          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: () => {
          this.allComplete = true;
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }
}
