import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';

import { LitterModalComponent } from './litter-modal.component';
import { DataService } from 'src/app/services/data.service';
import { ModalService } from 'src/app/services/modal.service';
import { ILitter, LitterStatus } from 'src/app/models/litter';
import { IPet } from 'src/app/models/pet';
import { ToastrService } from 'ngx-toastr';

describe('LitterModalComponent', () => {
  let component: LitterModalComponent;
  let fixture: ComponentFixture<LitterModalComponent>;
  let dataService: jasmine.SpyObj<DataService>;
  let modalService: jasmine.SpyObj<ModalService>;

  const mockLitter: ILitter = {
    id: 'litter-1',
    description: 'Test litter',
    status: LitterStatus.Started,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    parent_pets: [],
    puppies: []
  };

  const mockParentPet: IPet = {
    id: 'pet-1',
    name: 'Max',
    breed_id: 1,
    breed_name: 'Labrador',
    pet_dob: '2020-01-01',
    date_of_birth: '2020-01-01',
    gender: 'Male',
    weight: '30',
    location_name: 'Location 1',
    description: '',
    is_puppy: 0,
    has_microchip: 0,
    has_vaccination: 0,
    has_healthcertificate: 0,
    has_dewormed: 0,
    has_birthcertificate: 0
  };

  beforeEach(async () => {
    const dataServiceSpy = jasmine.createSpyObj('DataService', [
      'createLitter',
      'updateLitter',
      'getLitter'
    ]);
    const modalServiceSpy = jasmine.createSpyObj('ModalService', ['close'], {
      isVisible$: of(true)
    });
    const toastrServiceSpy = jasmine.createSpyObj('ToastrService', ['success', 'error', 'info', 'warning']);

    await TestBed.configureTestingModule({
      declarations: [LitterModalComponent],
      imports: [FormsModule, HttpClientTestingModule],
      providers: [
        { provide: DataService, useValue: dataServiceSpy },
        { provide: ModalService, useValue: modalServiceSpy },
        { provide: ToastrService, useValue: toastrServiceSpy }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();

    dataService = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
    modalService = TestBed.inject(ModalService) as jasmine.SpyObj<ModalService>;

    fixture = TestBed.createComponent(LitterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Mode Switching', () => {
    it('should return correct title for create mode', () => {
      component.mode = 'create';
      expect(component.getTitle()).toBe('Create New Litter');
    });

    it('should return correct title for update mode', () => {
      component.mode = 'update';
      expect(component.getTitle()).toBe('Update Litter');
    });

    it('should return correct title for view mode', () => {
      component.mode = 'view';
      expect(component.getTitle()).toBe('View Litter Details');
    });

    it('should populate form when litter input changes', () => {
      const litter: ILitter = {
        ...mockLitter,
        description: 'Updated description'
      };
      component.litter = litter;
      component.ngOnChanges({
        litter: {
          currentValue: litter,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      expect(component.formData.description).toBe('Updated description');
    });
  });

  describe('Conditional Rendering', () => {
    it('should return false when litter has no parent pets', () => {
      component.litter = mockLitter;
      expect(component.hasParentPets()).toBe(false);
    });

    it('should return false when litter has empty parent pets array', () => {
      component.litter = { ...mockLitter, parent_pets: [] };
      expect(component.hasParentPets()).toBe(false);
    });

    it('should return true when litter has parent pets', () => {
      component.litter = {
        ...mockLitter,
        parent_pets: [mockParentPet]
      };
      expect(component.hasParentPets()).toBe(true);
    });

    it('should return false when litter is null', () => {
      component.litter = null;
      expect(component.hasParentPets()).toBe(false);
    });
  });

  describe('Save/Close Actions', () => {
    it('should create new litter in create mode', () => {
      component.mode = 'create';
      component.formData.description = 'New litter';
      const newLitter: ILitter = { ...mockLitter, description: 'New litter' };
      dataService.createLitter.and.returnValue(of(newLitter));

      spyOn(component.litterSaved, 'emit');
      component.save();

      expect(dataService.createLitter).toHaveBeenCalledWith('New litter');
      expect(component.litterSaved.emit).toHaveBeenCalledWith(newLitter);
      expect(modalService.close).toHaveBeenCalled();
    });

    it('should update existing litter in update mode', () => {
      component.mode = 'update';
      component.litter = mockLitter;
      component.formData.description = 'Updated description';
      const updatedLitter: ILitter = { ...mockLitter, description: 'Updated description' };
      dataService.updateLitter.and.returnValue(of(updatedLitter));

      spyOn(component.litterSaved, 'emit');
      component.save();

      expect(dataService.updateLitter).toHaveBeenCalledWith('litter-1', { description: 'Updated description' });
      expect(component.litterSaved.emit).toHaveBeenCalledWith(updatedLitter);
      expect(modalService.close).toHaveBeenCalled();
    });

    it('should handle create error gracefully', () => {
      component.mode = 'create';
      component.formData.description = 'New litter';
      dataService.createLitter.and.returnValue(throwError(() => new Error('Create failed')));

      spyOn(window, 'alert');
      spyOn(console, 'error');
      component.save();

      expect(console.error).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Failed to create litter. Please try again.');
    });

    it('should handle update error gracefully', () => {
      component.mode = 'update';
      component.litter = mockLitter;
      component.formData.description = 'Updated description';
      dataService.updateLitter.and.returnValue(throwError(() => new Error('Update failed')));

      spyOn(window, 'alert');
      spyOn(console, 'error');
      component.save();

      expect(console.error).toHaveBeenCalled();
      expect(window.alert).toHaveBeenCalledWith('Failed to update litter. Please try again.');
    });

    it('should close modal and clear form data', () => {
      component.formData.description = 'Some description';
      component.close();

      expect(modalService.close).toHaveBeenCalled();
      expect(component.formData.description).toBe('');
    });

    it('should not save in view mode', () => {
      component.mode = 'view';
      component.save();

      expect(dataService.createLitter).not.toHaveBeenCalled();
      expect(dataService.updateLitter).not.toHaveBeenCalled();
    });
  });

  describe('Event Handlers', () => {
    it('should reload litter data when pets are assigned', () => {
      component.litter = mockLitter;
      const updatedLitter: ILitter = {
        ...mockLitter,
        parent_pets: [mockParentPet],
        status: LitterStatus.InProcess
      };
      dataService.getLitter.and.returnValue(of(updatedLitter));

      spyOn(component.litterSaved, 'emit');
      component.onPetsAssigned([mockParentPet]);

      expect(dataService.getLitter).toHaveBeenCalledWith('litter-1');
      expect(component.litter).toEqual(updatedLitter);
      expect(component.litterSaved.emit).toHaveBeenCalledWith(updatedLitter);
    });

    it('should handle error when reloading after pet assignment', () => {
      component.litter = mockLitter;
      dataService.getLitter.and.returnValue(throwError(() => new Error('Reload failed')));

      spyOn(console, 'error');
      component.onPetsAssigned([mockParentPet]);

      expect(console.error).toHaveBeenCalledWith('Error reloading litter:', jasmine.any(Error));
    });

    it('should reload litter data when puppies are added', () => {
      component.litter = mockLitter;
      const puppy: IPet = {
        id: 'puppy-1',
        name: 'Puppy',
        breed_id: 1,
        breed_name: 'Labrador',
        pet_dob: '2024-01-01',
        date_of_birth: '2024-01-01',
        gender: 'Male',
        weight: '5',
        location_name: 'Location 1',
        description: '',
        is_puppy: 1,
        has_microchip: 0,
        has_vaccination: 0,
        has_healthcertificate: 0,
        has_dewormed: 0,
        has_birthcertificate: 0
      };
      const updatedLitter: ILitter = {
        ...mockLitter,
        puppies: [puppy],
        status: LitterStatus.Done
      };
      dataService.getLitter.and.returnValue(of(updatedLitter));

      spyOn(component.litterSaved, 'emit');
      component.onPuppiesAdded([puppy]);

      expect(dataService.getLitter).toHaveBeenCalledWith('litter-1');
      expect(component.litter).toEqual(updatedLitter);
      expect(component.litterSaved.emit).toHaveBeenCalledWith(updatedLitter);
    });

    it('should handle error when reloading after puppy addition', () => {
      component.litter = mockLitter;
      dataService.getLitter.and.returnValue(throwError(() => new Error('Reload failed')));

      spyOn(console, 'error');
      component.onPuppiesAdded([]);

      expect(console.error).toHaveBeenCalledWith('Error reloading litter:', jasmine.any(Error));
    });

    it('should not reload if litter has no id when pets assigned', () => {
      component.litter = { ...mockLitter, id: '' };
      component.onPetsAssigned([mockParentPet]);

      expect(dataService.getLitter).not.toHaveBeenCalled();
    });

    it('should not reload if litter has no id when puppies added', () => {
      component.litter = { ...mockLitter, id: '' };
      component.onPuppiesAdded([]);

      expect(dataService.getLitter).not.toHaveBeenCalled();
    });
  });

  describe('Form Population', () => {
    it('should populate form with litter description', () => {
      component.litter = { ...mockLitter, description: 'Test description' };
      component.populateForm();
      expect(component.formData.description).toBe('Test description');
    });

    it('should handle null description', () => {
      component.litter = { ...mockLitter, description: null };
      component.populateForm();
      expect(component.formData.description).toBe('');
    });

    it('should handle undefined description', () => {
      component.litter = { ...mockLitter, description: undefined };
      component.populateForm();
      expect(component.formData.description).toBe('');
    });
  });
});
