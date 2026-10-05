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

  /** Inline errors for the password section (keyed by form control). */
  passwordErrors: { current_password?: string; new_password?: string; confirm_password?: string } = {};

  private get wantsPasswordChange(): boolean {
    const v = this.profileForm.value;
    return !!(v.current_password || v.new_password || v.confirm_password);
  }

  private validatePasswordFields(): boolean {
    const { current_password, new_password, confirm_password } = this.profileForm.value;
    const errors: typeof this.passwordErrors = {};
    if (this.hasPassword && !current_password) {
      errors.current_password = 'Enter your current password';
    }
    if (!new_password) {
      errors.new_password = 'Enter a new password';
    } else if (new_password.length < 8 || !/[a-zA-Z]/.test(new_password) || !/\d/.test(new_password)) {
      errors.new_password = 'Use at least 8 characters with a letter and a number';
    }
    if (new_password && confirm_password !== new_password) {
      errors.confirm_password = "Passwords don't match";
    }
    this.passwordErrors = errors;
    return Object.keys(errors).length === 0;
  }

  private resetPasswordFields(): void {
    this.profileForm.patchValue({ current_password: '', new_password: '', confirm_password: '' });
    this.passwordErrors = {};
  }

  saveProfile(): void {
    this.passwordErrors = {};
    const changingPassword = this.wantsPasswordChange;
    if (changingPassword && !this.validatePasswordFields()) {
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.saveSuccess = false;
    this.saveError = null;
    const { name, phone_number, current_password, new_password } = this.profileForm.value;

    const finish = (message: string) => {
      this.saveSuccess = true;
      this.isLoading = false;
      this.toastr.success(message, 'Success');
      this.cdr.detectChanges();
      setTimeout(() => {
        this.saveSuccess = false;
        this.cdr.detectChanges();
      }, 3000);
    };

    const fail = (error: any) => {
      this.isLoading = false;
      const detail = error.error?.detail;
      if (detail === 'CURRENT_PASSWORD_INCORRECT') {
        this.passwordErrors = { current_password: 'Current password is incorrect' };
      } else if (changingPassword && error.status === 400 && typeof detail === 'string') {
        this.passwordErrors = { new_password: detail };
      } else {
        this.saveError = typeof detail === 'string' ? detail : 'Failed to save profile';
        this.toastr.error(this.saveError!, 'Error');
      }
      this.cdr.detectChanges();
    };

    this.dataService.updateUserProfile({ name, phone_number }).subscribe({
      next: () => {
        if (!changingPassword) {
          finish('Profile updated successfully');
          return;
        }
        this.dataService.changePassword(this.hasPassword ? current_password : null, new_password).subscribe({
          next: () => {
            this.resetPasswordFields();
            finish('Profile saved and password changed');
          },
          error: fail,
        });
      },
      error: fail,
    });
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
