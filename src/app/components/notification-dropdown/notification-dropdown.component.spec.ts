import { Router } from '@angular/router';

import { NotificationDropdownComponent } from './notification-dropdown.component';
import { Notification } from '../../services/notification.service';

describe('NotificationDropdownComponent navigation', () => {
  function navigateFor(partial: Partial<Notification>): jasmine.Spy {
    const router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    const component = new NotificationDropdownComponent(null as any, null as any, null as any, router, null as any);
    component.navigateToSource({
      id: 'n1', user_id: 'u1', type: 'x', title: 't', message: null,
      related_id: null, related_type: null, is_read: false, created_at: '', ...partial
    });
    return router.navigate;
  }

  it('sends breeding milestone reminders to the milestone redirect', () => {
    const navigate = navigateFor({ type: 'breeding_milestone', related_type: 'breeding_milestone', related_id: 'x1' });
    expect(navigate).toHaveBeenCalledWith(['/milestones', 'x1']);
  });

  it('uses a calendar icon for milestone reminders', () => {
    const component = new NotificationDropdownComponent(null as any, null as any, null as any, null as any, null as any);
    expect(component.getNotificationIcon('breeding_milestone')).toBe('pi-calendar');
  });

  it('sends breeder-side waitlist notifications to /waitlist', () => {
    const navigate = navigateFor({ type: 'waitlist_request', related_type: 'waitlist_entry_breeder', related_id: 'w1' });
    expect(navigate).toHaveBeenCalledWith(['/waitlist']);
  });

  it('sends seeker-side waitlist notifications to /my-waitlists', () => {
    const navigate = navigateFor({ type: 'waitlist_update', related_type: 'waitlist_entry_seeker', related_id: 'w1' });
    expect(navigate).toHaveBeenCalledWith(['/my-waitlists']);
  });

  it('uses a list icon and indigo colour for both waitlist types', () => {
    const component = new NotificationDropdownComponent(null as any, null as any, null as any, null as any, null as any);
    for (const t of ['waitlist_request', 'waitlist_update']) {
      expect(component.getNotificationIcon(t)).toBe('pi-list');
      expect(component.getNotificationIconClass(t)).toBe('text-indigo-500');
    }
  });
});
