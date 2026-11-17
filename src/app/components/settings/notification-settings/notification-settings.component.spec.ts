import { TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { of } from 'rxjs';

import { NotificationSettingsComponent } from './notification-settings.component';
import { NotificationPreferenceService } from '../../../services/notification-preference.service';
import { ToastService } from '../../../services/toast.service';
import { environment } from 'src/environments/environment';

describe('NotificationSettingsComponent waitlist toggle', () => {
  const original = environment.enableWaitlist;
  let prefs: jasmine.SpyObj<NotificationPreferenceService>;

  afterEach(() => { environment.enableWaitlist = original; });

  function create(flag: boolean) {
    environment.enableWaitlist = flag;
    prefs = jasmine.createSpyObj('NotificationPreferenceService', ['getPreferences', 'updatePreferences']);
    prefs.getPreferences.and.returnValue(of({
      id: 'p', user_id: 'u', message_received: true, favorite_added: false,
      breeding_reminder: true, waitlist_update: false, created_at: '', updated_at: ''
    }));
    prefs.updatePreferences.and.returnValue(of({} as any));
    TestBed.configureTestingModule({
      declarations: [NotificationSettingsComponent],
      imports: [CommonModule, ReactiveFormsModule],
      providers: [
        { provide: NotificationPreferenceService, useValue: prefs },
        { provide: ToastService, useValue: jasmine.createSpyObj('ToastService', ['success', 'error']) }
      ]
    });
    const fixture = TestBed.createComponent(NotificationSettingsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the toggle when the flag is on and sends waitlist_update on save', () => {
    const fixture = create(true);
    expect(fixture.nativeElement.querySelector('input[formControlName="waitlist_update"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Waitlist updates');
    fixture.componentInstance.savePreferences();
    expect(prefs.updatePreferences).toHaveBeenCalledWith(jasmine.objectContaining({ waitlist_update: false }));
  });

  it('hides the toggle and omits waitlist_update on save when the flag is off', () => {
    const fixture = create(false);
    expect(fixture.nativeElement.querySelector('input[formControlName="waitlist_update"]')).toBeNull();
    fixture.componentInstance.savePreferences();
    const payload = prefs.updatePreferences.calls.mostRecent().args[0];
    expect('waitlist_update' in payload).toBeFalse();
  });
});
