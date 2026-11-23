import { Observable } from 'rxjs';

/** Document links are signed for 15 minutes; refresh well before that. */
export const LINK_REFRESH_AFTER_MS = 10 * 60 * 1000;

/**
 * Click handler for a signed document link. A recent link opens normally.
 * An older one may have expired, so: open a blank tab synchronously (popup
 * blockers allow it during the click), fetch a newly signed URL, and point
 * the tab at it. `fetchUrl` emits the absolute URL, or null if the document
 * is gone.
 */
export function openWithFreshLink(
  event: MouseEvent,
  linksLoadedAt: number,
  fetchUrl: () => Observable<string | null>,
  onFail: () => void,
): void {
  if (Date.now() - linksLoadedAt < LINK_REFRESH_AFTER_MS) return;
  event.preventDefault();
  const tab = window.open('', '_blank');
  if (tab) tab.opener = null;
  fetchUrl().subscribe({
    next: (url) => {
      if (url && tab) {
        tab.location.href = url;
      } else {
        tab?.close();
        onFail();
      }
    },
    error: () => {
      tab?.close();
      onFail();
    },
  });
}
