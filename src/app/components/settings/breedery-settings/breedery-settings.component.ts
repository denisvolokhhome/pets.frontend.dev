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
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  apihost = environment.API_HOST;

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
        if (user.profile_image_path) {
          this.imagePreview = this.getImageUrl(user.profile_image_path);
        }
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

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    return `${this.apihost}/storage/${imagePath}`;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.saveError = 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP';
        this.toastr.error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP', 'Error');
        return;
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.saveError = 'File size exceeds 5MB limit';
        this.toastr.error('File size exceeds 5MB limit', 'Error');
        return;
      }

      this.selectedFile = file;
      this.saveError = null;

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);

      this.uploadImage();
    }
  }

  uploadImage(): void {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.cdr.detectChanges();

    this.dataService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        this.imagePreview = this.getImageUrl(response.profile_image_path);
        this.selectedFile = null;
        this.isLoading = false;
        this.toastr.success('Profile image uploaded successfully', 'Success');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.saveError = 'Failed to upload image';
        const errorMessage = error.error?.detail || 'Failed to upload image';
        this.toastr.error(errorMessage, 'Error');
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
