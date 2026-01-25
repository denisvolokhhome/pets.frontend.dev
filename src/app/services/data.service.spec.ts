import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DataService } from './data.service';
import { IUser, IProfileImageResponse } from '../models/user';
import { ILocation } from '../models/location';
import { environment } from 'src/environments/environment';

describe('DataService', () => {
  let service: DataService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.API_URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService]
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Mock localStorage
    let store: { [key: string]: string } = {};
    const mockLocalStorage = {
      getItem: (key: string): string | null => {
        return key in store ? store[key] : null;
      },
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
    spyOn(localStorage, 'getItem').and.callFake(mockLocalStorage.getItem);
    spyOn(localStorage, 'setItem').and.callFake(mockLocalStorage.setItem);
    spyOn(localStorage, 'removeItem').and.callFake(mockLocalStorage.removeItem);
    spyOn(localStorage, 'clear').and.callFake(mockLocalStorage.clear);
    
    // Set a mock token
    mockLocalStorage.setItem('id_token', 'mock-token-123');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('User Profile Methods', () => {
    it('should get current user profile', () => {
      const mockUser: IUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        breedery_name: 'Test Breedery',
        profile_image_path: '/path/to/image.jpg',
        breedery_description: 'Test description',
        search_tags: ['tag1', 'tag2']
      };

      service.getCurrentUserProfile().subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(user.email).toBe('test@example.com');
        expect(user.breedery_name).toBe('Test Breedery');
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-123');
      req.flush(mockUser);
    });

    it('should update user profile', () => {
      const updateData: Partial<IUser> = {
        breedery_name: 'Updated Breedery',
        breedery_description: 'Updated description',
        search_tags: ['new-tag']
      };

      const mockResponse: IUser = {
        id: '123',
        email: 'test@example.com',
        breedery_name: 'Updated Breedery',
        breedery_description: 'Updated description',
        search_tags: ['new-tag']
      };

      service.updateUserProfile(updateData).subscribe(user => {
        expect(user).toEqual(mockResponse);
        expect(user.breedery_name).toBe('Updated Breedery');
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-123');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });

    it('should upload profile image', () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockResponse: IProfileImageResponse = {
        profile_image_path: '/storage/profile_123.jpg',
        message: 'Profile image uploaded successfully'
      };

      service.uploadProfileImage(mockFile).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.profile_image_path).toBe('/storage/profile_123.jpg');
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me/profile-image`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-123');
      expect(req.request.body instanceof FormData).toBe(true);
      req.flush(mockResponse);
    });

    it('should handle 401 error when getting user profile', () => {
      service.getCurrentUserProfile().subscribe({
        next: () => fail('should have failed with 401 error'),
        error: (error) => {
          expect(error.message).toBe('Unauthorized. Please log in again.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      req.flush({ detail: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 422 validation error when updating profile', () => {
      const updateData: Partial<IUser> = {
        breedery_name: ''
      };

      service.updateUserProfile(updateData).subscribe({
        next: () => fail('should have failed with 422 error'),
        error: (error) => {
          expect(error.message).toContain('Validation error');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      req.flush({ detail: 'Validation error' }, { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should handle 413 error when uploading large image', () => {
      const mockFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' });

      service.uploadProfileImage(mockFile).subscribe({
        next: () => fail('should have failed with 413 error'),
        error: (error) => {
          expect(error.message).toBe('File size too large.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me/profile-image`);
      req.flush({ detail: 'File too large' }, { status: 413, statusText: 'Payload Too Large' });
    });
  });

  describe('Location Management Methods', () => {
    it('should create a new location', () => {
      const newLocation: Partial<ILocation> = {
        name: 'Test Location',
        address1: '123 Main St',
        city: 'Test City',
        state: 'TS',
        country: 'Test Country',
        zipcode: '12345',
        location_type: 'user'
      };

      const mockResponse: ILocation = {
        id: 1,
        ...newLocation,
        address2: '',
        user_id: '123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      } as ILocation;

      service.createLocation(newLocation).subscribe(location => {
        expect(location).toEqual(mockResponse);
        expect(location.name).toBe('Test Location');
      });

      const req = httpMock.expectOne(`${apiUrl}/locations`);
      expect(req.request.method).toBe('POST');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-123');
      expect(req.request.body).toEqual(newLocation);
      req.flush(mockResponse);
    });

    it('should update an existing location', () => {
      const locationId = 1;
      const updateData: Partial<ILocation> = {
        name: 'Updated Location',
        city: 'Updated City'
      };

      const mockResponse: ILocation = {
        id: locationId,
        name: 'Updated Location',
        address1: '123 Main St',
        address2: '',
        city: 'Updated City',
        state: 'TS',
        country: 'Test Country',
        zipcode: '12345',
        location_type: 'user',
        user_id: '123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      service.updateLocation(locationId, updateData).subscribe(location => {
        expect(location).toEqual(mockResponse);
        expect(location.name).toBe('Updated Location');
      });

      const req = httpMock.expectOne(`${apiUrl}/locations/${locationId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-123');
      expect(req.request.body).toEqual(updateData);
      req.flush(mockResponse);
    });

    it('should delete a location', () => {
      const locationId = 1;

      service.deleteLocation(locationId).subscribe(response => {
        expect(response).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/locations/${locationId}`);
      expect(req.request.method).toBe('DELETE');
      expect(req.request.headers.get('Authorization')).toBe('Bearer mock-token-123');
      req.flush(null);
    });

    it('should handle 404 error when location not found', () => {
      const locationId = 999;

      service.deleteLocation(locationId).subscribe({
        next: () => fail('should have failed with 404 error'),
        error: (error) => {
          expect(error.message).toBe('Resource not found.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/locations/${locationId}`);
      req.flush({ detail: 'Location not found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 409 conflict when deleting location with pets', () => {
      const locationId = 1;

      service.deleteLocation(locationId).subscribe({
        next: () => fail('should have failed with 409 error'),
        error: (error) => {
          expect(error.message).toBe('Cannot delete location with associated pets');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/locations/${locationId}`);
      req.flush(
        { detail: 'Cannot delete location with associated pets' },
        { status: 409, statusText: 'Conflict' }
      );
    });

    it('should handle 422 validation error when creating location', () => {
      const invalidLocation: Partial<ILocation> = {
        name: '',
        address1: '123 Main St'
      };

      service.createLocation(invalidLocation).subscribe({
        next: () => fail('should have failed with 422 error'),
        error: (error) => {
          expect(error.message).toContain('Validation error');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/locations`);
      req.flush({ detail: 'Validation error' }, { status: 422, statusText: 'Unprocessable Entity' });
    });

    it('should handle 403 forbidden error when accessing other user location', () => {
      const locationId = 1;

      service.updateLocation(locationId, { name: 'Test' }).subscribe({
        next: () => fail('should have failed with 403 error'),
        error: (error) => {
          expect(error.message).toBe('Access forbidden.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/locations/${locationId}`);
      req.flush({ detail: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 500 server error', () => {
      service.getCurrentUserProfile().subscribe({
        next: () => fail('should have failed with 500 error'),
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/users/me`);
      req.flush({ detail: 'Internal server error' }, { status: 500, statusText: 'Internal Server Error' });
    });
  });
});
