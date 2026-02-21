import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { IUser } from '../../../models/user';
import { ToastService } from '../../../services/toast.service';
import { environment } from '../../../../environments/environment';

@Component({
  standalone: false,
  selector: 'app-breedery-settings',
  templateUrl: './breedery-settings.component.html',
  styleUrls: ['./breedery-settings.component.css']
})
export class BreederySettingsComponent implements OnInit {
  profileForm: FormGroup;
  tags: string[] = [];
  tagInput: string = '';
  isLoading: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;
  currentUser: IUser | null = null;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    public authService: AuthService,
    private toastr: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.profileForm = this.fb.group({
      breedery_name: [''],
      breedery_description: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.isLoading = true;
    this.saveError = null;
    
    const loadingTimeout = setTimeout(() => {
      if (this.isLoading) {
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
          breedery_name: user.breedery_name || '',
          breedery_description: user.breedery_description || ''
        });
        this.tags = user.search_tags || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        clearTimeout(loadingTimeout);
        console.error('Error loading profile:', error);
        this.toastr.error('Failed to load profile information', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addTag(): void {
    const tag = this.tagInput.trim();
    if (tag && !this.tags.includes(tag)) {
      this.tags.push(tag);
      this.tagInput = '';
    }
  }

  removeTag(index: number): void {
    this.tags.splice(index, 1);
  }

  async saveProfile(): Promise<void> {
    if (this.profileForm.invalid) {
      this.toastr.warning('Please fill in all required fields', 'Validation Error');
      return;
    }

    this.isLoading = true;
    this.saveSuccess = false;
    this.saveError = null;

    const profileData = {
      breedery_name: this.profileForm.value.breedery_name,
      breedery_description: this.profileForm.value.breedery_description,
      search_tags: this.tags
    };

    this.dataService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        this.saveSuccess = true;
        this.isLoading = false;
        this.toastr.success('Breedery information updated successfully', 'Success');
        this.cdr.detectChanges();
        setTimeout(() => {
          this.saveSuccess = false;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        this.saveError = error.error?.detail || 'Failed to save breedery information';
        this.toastr.error(this.saveError || 'Failed to save breedery information', 'Error');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
