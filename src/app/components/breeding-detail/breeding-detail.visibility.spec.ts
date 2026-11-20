import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { BreedingDetailComponent } from './breeding-detail.component';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';
import { OffspringService } from '../../services/offspring.service';

describe('BreedingDetailComponent puppy visibility', () => {
  let offspringSvc: jasmine.SpyObj<any>;

  function create(puppies: any[]) {
    const data = jasmine.createSpyObj('DataService', ['getBreeding']);
    data.getBreeding.and.returnValue(of({ id: 7, status: 'Started', parent_pets: [{ id: 'p' }], puppies, breed: {} }));
    offspringSvc = jasmine.createSpyObj('OffspringService', ['updateOffspring']);
    TestBed.configureTestingModule({
      declarations: [BreedingDetailComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DataService, useValue: data },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: ConfirmService, useValue: {} },
        { provide: OffspringService, useValue: offspringSvc },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ActivatedRoute, useValue: { params: of({ id: '7' }), snapshot: { queryParamMap: new Map() } } },
      ],
    });
    const fixture = TestBed.createComponent(BreedingDetailComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('counts hidden puppies for the hint', () => {
    const f = create([{ id: 'a', is_published: false }, { id: 'b', is_published: true }]);
    expect(f.componentInstance.hiddenPuppyCount).toBe(1);
  });

  it('publishes a hidden puppy with an explicit target state', () => {
    const f = create([]);
    const puppy: any = { id: 'a', is_published: false };
    offspringSvc.updateOffspring.and.returnValue(of({ is_published: true }));
    f.componentInstance.togglePublish(puppy);
    expect(offspringSvc.updateOffspring).toHaveBeenCalledWith('a', { is_published: true });
    expect(puppy.is_published).toBeTrue();
  });
});
