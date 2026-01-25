import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';
import { IUser } from '../../../models/user';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.css']
})
export class GeneralSettingsComponent implements OnInit {
  profileForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  tags: string[] = [];
  tagInput: string = '';
  isLoading: boolean = false;
  saveSuccess: boolean = false;
  saveError: string | null = null;
  currentUser: IUser | null = null;
  apihost = environment.API_HOST;

  constructor(
    private fb: FormBuilder,
    private dataService: DataService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.profileForm = this.fb.group({
      breedery_name: [''],
      breedery_description: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    
    // Remove 'app/' prefix if present (backend returns 'app/filename.png')
    const cleanPath = imagePath.startsWith('app/') ? imagePath.substring(4) : imagePath;
    
    // Use /storage endpoint instead of /api
    return `${this.apihost}/storage/${cleanPath}`;
  }

  loadProfile(): void {
    this.isLoading = true;
    this.dataService.getCurrentUserProfile().subscribe({
      next: (user) => {
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
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.toastr.error('Failed to load profile information', 'Error');
        this.isLoading = false;
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        this.saveError = 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP';
        this.toastr.error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP', 'Error');
        return;
      }
      
      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.saveError = 'File size exceeds 5MB limit';
        this.toastr.error('File size exceeds 5MB limit', 'Error');
        return;
      }
      
      this.selectedFile = file;
      this.saveError = null;
      
      // Generate preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
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

  async uploadImage(): Promise<void> {
    if (!this.selectedFile) {
      return;
    }

    this.isLoading = true;
    this.dataService.uploadProfileImage(this.selectedFile).subscribe({
      next: (response) => {
        this.imagePreview = this.getImageUrl(response.profile_image_path);
        this.selectedFile = null;
        this.isLoading = false;
        this.toastr.success('Profile image uploaded successfully', 'Success');
      },
      error: (error) => {
        console.error('Error uploading image:', error);
        this.saveError = 'Failed to upload image';
        const errorMessage = error.error?.detail || 'Failed to upload image';
        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
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

    // Upload image first if selected
    if (this.selectedFile) {
      await this.uploadImage();
    }

    // Prepare profile data
    const profileData = {
      breedery_name: this.profileForm.value.breedery_name,
      breedery_description: this.profileForm.value.breedery_description,
      search_tags: this.tags
    };

    this.dataService.updateUserProfile(profileData).subscribe({
      next: (response) => {
        this.saveSuccess = true;
        this.isLoading = false;
        this.toastr.success('Profile updated successfully', 'Success');
        setTimeout(() => {
          this.saveSuccess = false;
        }, 3000);
      },
      error: (error) => {
        console.error('Error saving profile:', error);
        this.saveError = error.error?.detail || 'Failed to save profile';
        const errorMessage = error.error?.detail || 'Failed to save profile';
        this.toastr.error(errorMessage, 'Error');
        this.isLoading = false;
      }
    });
  }
}
