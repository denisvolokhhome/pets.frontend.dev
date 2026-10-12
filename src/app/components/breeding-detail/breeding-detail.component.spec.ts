import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';

import { BreedingDetailComponent } from './breeding-detail.component';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmService } from '../../services/confirm.service';

describe('BreedingDetailComponent waitlist card', () => {
  function render(enabled: boolean): HTMLElement {
    const data = jasmine.createSpyObj('DataService', ['getBreeding']);
    data.getBreeding.and.returnValue(of({
      id: 7, status: 'Started', stage: 'Planned', parent_pets: [], puppies: [], breed: {}
    }));
    TestBed.configureTestingModule({
      declarations: [BreedingDetailComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: DataService, useValue: data },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) },
        { provide: ConfirmService, useValue: {} },
        { provide: Router, useValue: { navigate: () => {} } },
        { provide: ActivatedRoute, useValue: { params: of({ id: '7' }) } }
      ]
    });
    const fixture = TestBed.createComponent(BreedingDetailComponent);
    (fixture.componentInstance as any).waitlistEnabled = enabled;
    fixture.detectChanges();
    return fixture.nativeElement;
  }

  it('renders app-breeding-waitlist only when the flag is on', () => {
    expect(render(true).querySelector('app-breeding-waitlist')).not.toBeNull();
  });

  it('renders no app-breeding-waitlist when the flag is off', () => {
    expect(render(false).querySelector('app-breeding-waitlist')).toBeNull();
  });
});
