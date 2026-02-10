import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { GeneralSettingsComponent } from './general-settings.component';
import { DataService } from '../../../services/data.service';
import { AuthService } from '../../../services/auth.service';

describe('GeneralSettingsComponent', () => {
  let component: GeneralSettingsComponent;
  let fixture: ComponentFixture<GeneralSettingsComponent>;
  let dataService: jasmine.SpyObj<DataService>;
  let authService: jasmine.SpyObj<AuthService>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  const mockUser = {
    id: '123',
    email: 'test@example.com',
    name: 'Test User',
    breedery_name: 'Test Breedery',
    breedery_description: 'Test Description',
    search_tags: ['tag1', 'tag2'],
    profile_image_path: '/path/to/image.jpg'
  };

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', [
      'getCurrentUserProfile',
      'updateUserProfile',
      'uploadProfileImage'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['IsLoggedIn']);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', [
      'success',
      'error',
      'warning'
    ]);

    await TestBed.configureTestingModule({
      declarations: [GeneralSettingsComponent],
      imports: [ReactiveFormsModule, FormsModule, HttpClientTestingModule],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ]
    }).compileComponents();

    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GeneralSettingsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    dataService.getCurrentUserProfile.and.returnValue(of(mockUser));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Form Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.profileForm.value).toEqual({
        breedery_name: '',
        breedery_description: ''
      });
    });

    it('should load user profile on init', () => {
      dataService.getCurrentUserProfile.and.returnValue(of(mockUser));
      
      component.ngOnInit();
      
      expect(dataService.getCurrentUserProfile).toHaveBeenCalled();
      expect(component.profileForm.value.breedery_name).toBe('Test Breedery');
      expect(component.profileForm.value.breedery_description).toBe('Test Description');
      expect(component.tags).toEqual(['tag1', 'tag2']);
      expect(component.imagePreview).toBe('/path/to/image.jpg');
    });

    it('should handle empty profile fields', () => {
      const emptyUser = { ...mockUser, breedery_name: undefined as any, breedery_description: undefined as any, search_tags: undefined as any };
      dataService.getCurrentUserProfile.and.returnValue(of(emptyUser));
      
      component.ngOnInit();
      
      expect(component.profileForm.value.breedery_name).toBe('');
      expect(component.profileForm.value.breedery_description).toBe('');
      expect(component.tags).toEqual([]);
    });

    it('should handle profile load error', () => {
      dataService.getCurrentUserProfile.and.returnValue(
        throwError(() => new Error('Load failed'))
      );
      
      component.ngOnInit();
      
      expect(component.isLoading).toBe(false);
    });
  });

  describe('Tag Management', () => {
    beforeEach(() => {
      dataService.getCurrentUserProfile.and.returnValue(of(mockUser));
      fixture.detectChanges();
    });

    it('should add a new tag', () => {
      component.tags = [];
      component.tagInput = 'newtag';
      
      component.addTag();
      
      expect(component.tags).toContain('newtag');
      expect(component.tagInput).toBe('');
    });

    it('should not add empty tag', () => {
      component.tags = [];
      component.tagInput = '   ';
      
      component.addTag();
      
      expect(component.tags.length).toBe(0);
    });

    it('should not add duplicate tag', () => {
      component.tags = ['existing'];
      component.tagInput = 'existing';
      
      component.addTag();
      
      expect(component.tags.length).toBe(1);
    });

    it('should trim whitespace from tags', () => {
      component.tags = [];
      component.tagInput = '  newtag  ';
      
      component.addTag();
      
      expect(component.tags).toContain('newtag');
    });

    it('should remove tag at specified index', () => {
      component.tags = ['tag1', 'tag2', 'tag3'];
      
      component.removeTag(1);
      
      expect(component.tags).toEqual(['tag1', 'tag3']);
    });
  });

  describe('File Selection and Preview', () => {
    beforeEach(() => {
      dataService.getCurrentUserProfile.and.returnValue(of(mockUser));
      fixture.detectChanges();
    });

    it('should handle valid image file selection', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [file]
        }
      } as any;

      component.onFileSelected(event);

      expect(component.selectedFile).toBe(file);
      expect(component.saveError).toBeNull();
    });

    it('should reject invalid file type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [file]
        }
      } as any;

      component.onFileSelected(event);

      expect(component.selectedFile).toBeNull();
      expect(component.saveError).toContain('Invalid file type');
    });

    it('should reject file exceeding size limit', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [largeFile]
        }
      } as any;

      component.onFileSelected(event);

      expect(component.selectedFile).toBeNull();
      expect(component.saveError).toContain('exceeds 5MB limit');
    });

    it('should accept valid file types', () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      validTypes.forEach(type => {
        const file = new File([''], 'test.jpg', { type });
        const event = {
          target: {
            files: [file]
          }
        } as any;

        component.onFileSelected(event);

        expect(component.selectedFile).toBe(file);
        expect(component.saveError).toBeNull();
      });
    });
  });

  describe('Form Validation', () => {
    beforeEach(() => {
      dataService.getCurrentUserProfile.and.returnValue(of(mockUser));
      fixture.detectChanges();
    });

    it('should have valid form with empty fields', () => {
      component.profileForm.patchValue({
        breedery_name: '',
        breedery_description: ''
      });

      expect(component.profileForm.valid).toBe(true);
    });

    it('should have valid form with filled fields', () => {
      component.profileForm.patchValue({
        breedery_name: 'My Breedery',
        breedery_description: 'Description'
      });

      expect(component.profileForm.valid).toBe(true);
    });
  });

  describe('Profile Save', () => {
    beforeEach(() => {
      dataService.getCurrentUserProfile.and.returnValue(of(mockUser));
      fixture.detectChanges();
    });

    it('should save profile successfully', async () => {
      const updatedUser = { ...mockUser, breedery_name: 'Updated Breedery' };
      dataService.updateUserProfile.and.returnValue(of(updatedUser));

      component.profileForm.patchValue({
        breedery_name: 'Updated Breedery',
        breedery_description: 'Updated Description'
      });

      await component.saveProfile();

      expect(dataService.updateUserProfile).toHaveBeenCalledWith({
        breedery_name: 'Updated Breedery',
        breedery_description: 'Updated Description',
        search_tags: jasmine.any(Array)
      });
      expect(component.saveSuccess).toBe(true);
    });

    it('should handle save error', async () => {
      dataService.updateUserProfile.and.returnValue(
        throwError(() => ({ error: { detail: 'Save failed' } }))
      );

      await component.saveProfile();

      expect(component.saveError).toBe('Save failed');
      expect(component.saveSuccess).toBe(false);
    });

    it('should not save if form is invalid', async () => {
      component.profileForm.setErrors({ invalid: true });

      await component.saveProfile();

      expect(dataService.updateUserProfile).not.toHaveBeenCalled();
    });

    it('should upload image before saving profile', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedFile = file;
      
      dataService.uploadProfileImage.and.returnValue(
        of({ profile_image_path: '/new/path.jpg', message: 'Success' })
      );
      dataService.updateUserProfile.and.returnValue(of(mockUser));

      await component.saveProfile();

      expect(dataService.uploadProfileImage).toHaveBeenCalledWith(file);
      expect(dataService.updateUserProfile).toHaveBeenCalled();
    });
  });

  describe('Error Handling and User Feedback', () => {
    beforeEach(() => {
      dataService.getCurrentUserProfile.and.returnValue(of(mockUser));
      fixture.detectChanges();
    });

    it('should display error toast when profile load fails', () => {
      const error = { error: { detail: 'Network error' } };
      dataService.getCurrentUserProfile.and.returnValue(throwError(() => error));
      
      component.loadProfile();
      
      expect(toastrService.error).toHaveBeenCalledWith(
        'Failed to load profile information',
        'Error'
      );
    });

    it('should display error toast for invalid file type', () => {
      const file = new File([''], 'test.pdf', { type: 'application/pdf' });
      const event = {
        target: {
          files: [file]
        }
      } as any;

      component.onFileSelected(event);

      expect(toastrService.error).toHaveBeenCalledWith(
        'Invalid file type. Allowed: JPEG, PNG, GIF, WebP',
        'Error'
      );
    });

    it('should display error toast for file size exceeding limit', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const event = {
        target: {
          files: [largeFile]
        }
      } as any;

      component.onFileSelected(event);

      expect(toastrService.error).toHaveBeenCalledWith(
        'File size exceeds 5MB limit',
        'Error'
      );
    });

    it('should display success toast when image uploads successfully', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedFile = file;
      
      dataService.uploadProfileImage.and.returnValue(
        of({ profile_image_path: '/new/path.jpg', message: 'Success' })
      );

      await component.uploadImage();

      expect(toastrService.success).toHaveBeenCalledWith(
        'Profile image uploaded successfully',
        'Success'
      );
    });

    it('should display error toast when image upload fails', async () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      component.selectedFile = file;
      
      const error = { error: { detail: 'Upload failed' } };
      dataService.uploadProfileImage.and.returnValue(throwError(() => error));

      await component.uploadImage();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Upload failed',
        'Error'
      );
    });

    it('should display success toast when profile saves successfully', async () => {
      const updatedUser = { ...mockUser, breedery_name: 'Updated Breedery' };
      dataService.updateUserProfile.and.returnValue(of(updatedUser));

      component.profileForm.patchValue({
        breedery_name: 'Updated Breedery',
        breedery_description: 'Updated Description'
      });

      await component.saveProfile();

      expect(toastrService.success).toHaveBeenCalledWith(
        'Profile updated successfully',
        'Success'
      );
    });

    it('should display error toast when profile save fails', async () => {
      const error = { error: { detail: 'Save failed' } };
      dataService.updateUserProfile.and.returnValue(throwError(() => error));

      await component.saveProfile();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Save failed',
        'Error'
      );
    });

    it('should display warning toast when form is invalid on save', async () => {
      component.profileForm.setErrors({ invalid: true });

      await component.saveProfile();

      expect(toastrService.warning).toHaveBeenCalledWith(
        'Please fill in all required fields',
        'Validation Error'
      );
    });

    it('should display generic error message when error detail is not provided', async () => {
      const error = { error: {} };
      dataService.updateUserProfile.and.returnValue(throwError(() => error));

      await component.saveProfile();

      expect(toastrService.error).toHaveBeenCalledWith(
        'Failed to save profile',
        'Error'
      );
    });
  });
});
