import { Subject, throwError } from 'rxjs';
import { PetAddComponent } from './pet-add.component';

describe('PetAddComponent submit', () => {
  let dataService: jasmine.SpyObj<any>;
  let modalService: jasmine.SpyObj<any>;
  let toastService: jasmine.SpyObj<any>;
  let component: PetAddComponent;

  beforeEach(() => {
    dataService = jasmine.createSpyObj('DataService', ['createPet', 'uploadPetImage', 'getBreeds', 'getLocations']);
    modalService = jasmine.createSpyObj('ModalService', ['close']);
    toastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    component = new PetAddComponent(dataService, modalService, toastService);
    component.addPetForm = jasmine.createSpyObj('NgForm', ['resetForm']);
  });

  it('sends only one create request when Save is clicked repeatedly', () => {
    const response = new Subject<any>();
    dataService.createPet.and.returnValue(response);

    component.submit();
    component.submit();
    component.submit();

    expect(dataService.createPet).toHaveBeenCalledTimes(1);
    expect(component.isSaving).toBeTrue();

    response.next({ id: 'p1', name: 'Rex' });
    response.complete();

    expect(component.isSaving).toBeFalse();
  });

  it('allows a retry after the create request fails', () => {
    dataService.createPet.and.returnValue(throwError(() => new Error('boom')));

    component.submit();
    expect(component.isSaving).toBeFalse();

    component.submit();
    expect(dataService.createPet).toHaveBeenCalledTimes(2);
  });
});
