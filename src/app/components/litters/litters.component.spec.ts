import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { LittersComponent } from './litters.component';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { ILitter, LitterStatus } from 'src/app/models/litter';
import { ILocation } from 'src/app/models/location';
import { IBreed } from 'src/app/models/breed';
import { IPet } from 'src/app/models/pet';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

describe('LittersComponent', () => {
  let component: LittersComponent;
  let fixture: ComponentFixture<LittersComponent>;
  let dataService: jasmine.SpyObj<DataService>;
  let modalService: jasmine.SpyObj<ModalService>;
  let toastrService: jasmine.SpyObj<ToastrService>;

  const mockLocations: ILocation[] = [
    {
      id: 1,
      name: 'Location 1',
      address1: '123 Main St',
      city: 'City',
      state: 'State',
      country: 'Country',
      zipcode: '12345',
      location_type: 'Home',
      created_at: '2023-01-01'
    },
    {
      id: 2,
      name: 'Location 2',
      address1: '456 Oak Ave',
      city: 'City',
      state: 'State',
      country: 'Country',
      zipcode: '67890',
      location_type: 'Kennel',
      created_at: '2023-01-01'
    }
  ];

  const mockBreeds: IBreed[] = [
    { id: 1, name: 'Labrador Retriever', code: 'LAB', group: 'Sporting', created_at: '2023-01-01', updated_at: '2023-01-01' },
    { id: 2, name: 'German Shepherd', code: 'GSD', group: 'Herding', created_at: '2023-01-01', updated_at: '2023-01-01' }
  ];

  const mockPet1: IPet = {
    id: 'pet-1',
    name: 'Pet 1',
    breed_name: 'Labrador Retriever',
    breed_id: 1,
    location_name: 'Location 1',
    pet_dob: '2020-01-01',
    gender: 'm',
    weight: '25',
    description: 'Test pet',
    is_puppy: 0,
    has_microchip: 1,
    has_vaccination: 1,
    has_healthcertificate: 0,
    has_dewormed: 1,
    has_birthcertificate: 0
  };

  const mockPet2: IPet = {
    id: 'pet-2',
    name: 'Pet 2',
    breed_name: 'German Shepherd',
    breed_id: 2,
    location_name: 'Location 1',
    pet_dob: '2020-06-01',
    gender: 'f',
    weight: '30',
    description: 'Test pet 2',
    is_puppy: 0,
    has_microchip: 1,
    has_vaccination: 1,
    has_healthcertificate: 1,
    has_dewormed: 1,
    has_birthcertificate: 1
  };

  const mockLitters: ILitter[] = [
    {
      id: 'litter-1',
      description: 'Test litter 1',
      status: LitterStatus.InProcess,
      created_at: '2023-01-01',
      updated_at: '2023-01-02',
      parent_pets: [mockPet1, mockPet1]
    },
    {
      id: 'litter-2',
      description: 'Test litter 2',
      status: LitterStatus.Done,
      created_at: '2023-02-01',
      updated_at: '2023-02-15',
      parent_pets: [mockPet1, mockPet2]
    },
    {
      id: 'litter-3',
      description: null,
      status: LitterStatus.Started,
      created_at: '2023-03-01',
      updated_at: '2023-03-01',
      parent_pets: []
    }
  ];

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', [
      'getLitters',
      'getLocations',
      'getBreeds',
      'voidLitter'
    ]);
    const modalServiceSpy = jasmine.createSpyObj('ModalService', ['open', 'close']);
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      declarations: [LittersComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: ModalService, useValue: modalServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    modalService = TestBed.inject(ModalService) as jasmine.SpyObj<ModalService>;
    toastrService = TestBed.inject(ToastrService) as jasmine.SpyObj<ToastrService>;

    // Setup default spy returns
    dataService.getLitters.and.returnValue(of(mockLitters));
    dataService.getLocations.and.returnValue(of(mockLocations));
    dataService.getBreeds.and.returnValue(of(mockBreeds));

    fixture = TestBed.createComponent(LittersComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load litters, locations, and breeds on init', () => {
      fixture.detectChanges(); // triggers ngOnInit

      expect(dataService.getLitters).toHaveBeenCalled();
      expect(dataService.getLocations).toHaveBeenCalled();
      expect(dataService.getBreeds).toHaveBeenCalled();
      expect(component.litters.length).toBe(3);
      expect(component.locations.length).toBe(2);
      expect(component.breeds.length).toBe(2);
    });

    it('should populate filteredLitters on init', () => {
      fixture.detectChanges();

      expect(component.filteredLitters.length).toBe(3);
    });

    it('should handle error when loading litters fails', () => {
      dataService.getLitters.and.returnValue(throwError(() => new Error('Load error')));
      spyOn(console, 'error');

      fixture.detectChanges();

      expect(console.error).toHaveBeenCalledWith('Error loading litters:', jasmine.any(Error));
    });
  });

  describe('Filter Application', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by location', () => {
      component.selectedLocationId = '1';
      component.applyFilters();

      expect(component.filteredLitters.length).toBe(2);
      component.filteredLitters.forEach(litter => {
        expect(component.getLocationName(litter)).toBe('Location 1');
      });
    });

    it('should filter by status', () => {
      component.selectedStatus = LitterStatus.Done;
      component.applyFilters();

      expect(component.filteredLitters.length).toBe(1);
      expect(component.filteredLitters[0].status).toBe(LitterStatus.Done);
    });

    it('should filter by breed', () => {
      component.selectedBreedId = '1';
      component.applyFilters();

      expect(component.filteredLitters.length).toBe(2);
    });

    it('should apply multiple filters together', () => {
      component.selectedLocationId = '1';
      component.selectedStatus = LitterStatus.InProcess;
      component.applyFilters();

      expect(component.filteredLitters.length).toBe(1);
      expect(component.filteredLitters[0].id).toBe('litter-1');
    });

    it('should show all litters when no filters are applied', () => {
      component.clearFilters();

      expect(component.filteredLitters.length).toBe(3);
    });
  });

  describe('Clear Filters', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should clear all filter selections', () => {
      component.selectedLocationId = '1';
      component.selectedStatus = LitterStatus.Done;
      component.selectedBreedId = '1';

      component.clearFilters();

      expect(component.selectedLocationId).toBe('');
      expect(component.selectedStatus).toBe('');
      expect(component.selectedBreedId).toBe('');
    });

    it('should reset filteredLitters to show all litters', () => {
      component.selectedStatus = LitterStatus.Done;
      component.applyFilters();
      expect(component.filteredLitters.length).toBe(1);

      component.clearFilters();

      expect(component.filteredLitters.length).toBe(3);
    });
  });

  describe('Breed Display Formatting', () => {
    it('should display single breed name for same-breed litters', () => {
      const litter = mockLitters[0]; // Both pets are Labrador Retriever
      const breedDisplay = component.getBreedDisplay(litter);

      expect(breedDisplay).toBe('Labrador Retriever');
      expect(breedDisplay).not.toContain('+');
    });

    it('should display both breeds with plus sign for mixed-breed litters', () => {
      const litter = mockLitters[1]; // Labrador + German Shepherd
      const breedDisplay = component.getBreedDisplay(litter);

      expect(breedDisplay).toContain('+');
      expect(breedDisplay).toContain('Labrador Retriever');
      expect(breedDisplay).toContain('German Shepherd');
    });

    it('should display "-" when no parent pets are assigned', () => {
      const litter = mockLitters[2]; // No parent pets
      const breedDisplay = component.getBreedDisplay(litter);

      expect(breedDisplay).toBe('-');
    });
  });

  describe('Location Display', () => {
    it('should display location name from parent pets', () => {
      const litter = mockLitters[0];
      const locationName = component.getLocationName(litter);

      expect(locationName).toBe('Location 1');
    });

    it('should display "-" when no parent pets are assigned', () => {
      const litter = mockLitters[2];
      const locationName = component.getLocationName(litter);

      expect(locationName).toBe('-');
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call addLitter when add button is clicked', () => {
      spyOn(console, 'log');
      component.addLitter();

      expect(console.log).toHaveBeenCalledWith('Add litter clicked');
    });

    it('should call viewLitter with correct litter', () => {
      spyOn(console, 'log');
      const litter = mockLitters[0];
      component.viewLitter(litter);

      expect(console.log).toHaveBeenCalledWith('View litter:', litter.id);
    });

    it('should call updateLitter with correct litter', () => {
      spyOn(console, 'log');
      const litter = mockLitters[0];
      component.updateLitter(litter);

      expect(console.log).toHaveBeenCalledWith('Update litter:', litter.id);
    });

    it('should void litter when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      dataService.voidLitter.and.returnValue(of(mockLitters[0]));
      spyOn(component, 'loadLitters');

      component.voidLitter(mockLitters[0]);

      expect(dataService.voidLitter).toHaveBeenCalledWith('litter-1');
      expect(component.loadLitters).toHaveBeenCalled();
    });

    it('should not void litter when cancelled', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.voidLitter(mockLitters[0]);

      expect(dataService.voidLitter).not.toHaveBeenCalled();
    });

    it('should handle error when voiding litter fails', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      dataService.voidLitter.and.returnValue(throwError(() => ({ error: { detail: 'Void error' } })));

      component.voidLitter(mockLitters[0]);

      expect(toastrService.error).toHaveBeenCalledWith('Failed to void litter: Void error', 'Error');
    });
  });

  describe('Helper Methods', () => {
    it('should format dates correctly', () => {
      const dateString = '2023-01-15T10:30:00Z';
      const formatted = component.formatDate(dateString);

      expect(formatted).toContain('2023');
    });

    it('should return "-" for empty date string', () => {
      const formatted = component.formatDate('');

      expect(formatted).toBe('-');
    });

    it('should return correct status badge class', () => {
      expect(component.getStatusBadgeClass(LitterStatus.Started)).toBe('badge-started');
      expect(component.getStatusBadgeClass(LitterStatus.InProcess)).toBe('badge-inprocess');
      expect(component.getStatusBadgeClass(LitterStatus.Done)).toBe('badge-done');
      expect(component.getStatusBadgeClass(LitterStatus.Voided)).toBe('badge-voided');
    });

    it('should detect active filters', () => {
      component.selectedLocationId = '';
      component.selectedStatus = '';
      component.selectedBreedId = '';
      expect(component.hasActiveFilters()).toBe(false);

      component.selectedLocationId = '1';
      expect(component.hasActiveFilters()).toBe(true);

      component.selectedLocationId = '';
      component.selectedStatus = LitterStatus.Done;
      expect(component.hasActiveFilters()).toBe(true);

      component.selectedStatus = '';
      component.selectedBreedId = '1';
      expect(component.hasActiveFilters()).toBe(true);
    });
  });
});
