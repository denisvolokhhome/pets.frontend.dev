import { of, throwError } from 'rxjs';

import { LINK_REFRESH_AFTER_MS, openWithFreshLink } from './fresh-link';

describe('openWithFreshLink', () => {
  let event: jasmine.SpyObj<MouseEvent>;
  let tab: { location: { href: string }; opener: any; close: jasmine.Spy };

  beforeEach(() => {
    event = jasmine.createSpyObj<MouseEvent>('event', ['preventDefault']);
    tab = { location: { href: '' }, opener: {}, close: jasmine.createSpy('close') };
    spyOn(window, 'open').and.returnValue(tab as any);
  });

  it('lets a fresh link open normally', () => {
    const fetch = jasmine.createSpy('fetch');
    openWithFreshLink(event, Date.now() - 60_000, fetch, () => {});
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('opens a tab right away and points it at a newly signed link when stale', () => {
    openWithFreshLink(event, Date.now() - LINK_REFRESH_AFTER_MS - 1,
      () => of('http://api/api/documents/download/1?exp=2&sig=new'), () => {});
    expect(event.preventDefault).toHaveBeenCalled();
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(tab.opener).toBeNull();
    expect(tab.location.href).toBe('http://api/api/documents/download/1?exp=2&sig=new');
  });

  it('closes the tab and reports when the document is gone or the refresh fails', () => {
    const onFail = jasmine.createSpy('onFail');
    openWithFreshLink(event, 0, () => of(null), onFail);
    openWithFreshLink(event, 0, () => throwError(() => new Error('x')), onFail);
    expect(tab.close).toHaveBeenCalledTimes(2);
    expect(onFail).toHaveBeenCalledTimes(2);
  });
});
