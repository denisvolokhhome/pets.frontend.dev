import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { IUser } from '../../../models/user';
import { ToastService } from '../../../services/toast.service';

@Component({
  standalone: false,
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.css']
})
export class GeneralSettingsComponent implements OnInit {
  profileForm: FormGroup;
  isLoading: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;
  currentUser: IUser | null = null;
  resetEmailSent: boolean = false;
  showConvertConfirm: boolean = false;
  isConverting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    public authService: AuthService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      name: [''],
      phone_number: [''],
      current_password: [''],
      new_password: [''],
      confirm_password: ['']
    });
  }
  
  get isBreeder(): boolean {
    return this.authService.isBreeder;
  }
  
  get isOAuthUser(): boolean {
    return !!this.currentUser?.oauth_provider;
  }
  
  get hasPassword(): boolean {
    return !this.isOAuthUser;
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.saveError = null;
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
        console.warn('Loading profile timed out after 10 seconds');
        this.isLoading = false;
        this.saveError = 'Loading timed out. Please refresh the page.';
        this.toastr.error('Loading timed out. Please refresh the page.', 'Error');
        this.cdr.detectChanges();
      }
    }, 10000);
    
    this.dataService.getCurrentUserProfile().subscribe({
      next: (user) => {
        clearTimeout(loadingTimeout);
        this.currentUser = user;
        this.profileForm.patchValue({
          name: user.name || '',
          phone_number: user.phone_number || ''
        });
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        clearTimeout(loadingTimeout);
        console.error('Error loading profile:', error);
        this.toastr.error('Failed to load profile information', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      complete: () => {
        clearTimeout(loadingTimeout);
        // Ensure loading is set to false even if next wasn't called
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.toastr.warning('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.saveSuccess = false;
    this.saveError = null;

    try {
      // Prepare profile data
      const profileData: any = {
        name: this.profileForm.value.name,
        phone_number: this.profileForm.value.phone_number
      };
      
      // Add password if provided
      if (this.profileForm.value.new_password) {
        if (this.profileForm.value.new_password !== this.profileForm.value.confirm_password) {
          this.toastr.error('Passwords do not match', 'Validation Error');
          this.isLoading = false;
          return;
        }
        profileData.password = this.profileForm.value.new_password;
      }

      this.dataService.updateUserProfile(profileData).subscribe({
        next: (response) => {
          this.saveSuccess = true;
          this.isLoading = false;
          this.toastr.success('Profile updated successfully', 'Success');
          this.cdr.detectChanges();
          setTimeout(() => {
            this.saveSuccess = false;
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (error) => {
          console.error('Error saving profile:', error);
          this.saveError = error.error?.detail || 'Failed to save profile';
          const errorMessage = error.error?.detail || 'Failed to save profile';
          this.toastr.error(errorMessage, 'Error');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } catch (error) {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  sendPasswordReset(): void {
    if (this.resetEmailSent || !this.currentUser?.email) return;
    this.authService.forgotPassword(this.currentUser.email).subscribe({
      next: () => {
        this.resetEmailSent = true;
        this.toastr.success('Password reset email sent. Check your inbox.', 'Email Sent');
        this.cdr.detectChanges();
      },
      error: () => {
        this.resetEmailSent = true;
        this.toastr.success('If the account exists, a reset email has been sent.', 'Email Sent');
        this.cdr.detectChanges();
      }
    });
  }

  get isPetSeeker(): boolean {
    return this.authService.isPetSeeker;
  }

  openConvertConfirm(): void {
    this.showConvertConfirm = true;
  }

  cancelConvert(): void {
    this.showConvertConfirm = false;
  }

  confirmConvertToBreeder(): void {
    this.isConverting = true;
    this.authService.convertToBreeder().subscribe({
      next: () => {
        this.isConverting = false;
        this.showConvertConfirm = false;
        this.toastr.success('Your account has been converted to a Breeder account.', 'Account Converted');
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.isConverting = false;
        const detail = error?.error?.detail || '';
        if (detail === 'ALREADY_BREEDER') {
          this.toastr.warning('Your account is already a breeder account.', 'Already a Breeder');
        } else {
          this.toastr.error('Failed to convert account. Please try again.', 'Error');
        }
        this.showConvertConfirm = false;
        this.cdr.detectChanges();
      }
    });
  }
}
