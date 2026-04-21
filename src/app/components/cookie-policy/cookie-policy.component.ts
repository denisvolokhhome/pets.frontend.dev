import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-cookie-policy',
  templateUrl: './cookie-policy.component.html',
  styleUrls: ['./cookie-policy.component.css']
})
export class CookiePolicyComponent {
  lastUpdated = 'April 20, 2026';

  downloadPolicy(): void {
    const blob = new Blob([this.getText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breedly-cookie-policy.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  private getText(): string {
    return `BREEDLY COOKIE POLICY
Last Updated: April 20, 2026

================================================================================

1. WHAT ARE COOKIES

Cookies are small text files placed on your device when you visit a website.
They help the site remember information about your visit, making your next
visit easier and the site more useful to you.

================================================================================

2. HOW BREEDLY USES COOKIES

Breedly uses only the cookies necessary to operate the platform. We do not
use advertising cookies, tracking pixels, or third-party analytics cookies.

2.1 Strictly Necessary Cookies

These cookies are required for the platform to function. They cannot be
disabled without breaking core functionality.

- Authentication token (id_token): Stores your JWT login token so you remain
  logged in as you navigate the platform. Expires when you log out or the
  token expires (default: 1 hour).

- Cookie consent (cookies_accepted): Records that you have acknowledged our
  cookie banner. Stored in localStorage. Persists until you clear browser data.

2.2 Functional Cookies

These cookies improve your experience but are not strictly required.

- Session preferences: Remembers UI state such as selected filters or
  navigation state during your session. Cleared when you close your browser.

================================================================================

3. WHAT WE DO NOT USE

- No advertising or marketing cookies
- No third-party tracking pixels
- No cross-site tracking
- No analytics cookies (e.g., Google Analytics)
- No social media tracking cookies

================================================================================

4. MANAGING COOKIES

You can control cookies through your browser settings:

- Chrome: Settings > Privacy and Security > Cookies
- Firefox: Settings > Privacy & Security > Cookies and Site Data
- Safari: Preferences > Privacy > Manage Website Data
- Edge: Settings > Cookies and Site Permissions

Note: Disabling strictly necessary cookies (especially the authentication
token) will prevent you from logging in and using authenticated features.

================================================================================

5. CHANGES TO THIS POLICY

We may update this Cookie Policy from time to time. Changes will be posted
on this page with a new "Last Updated" date.

================================================================================

6. CONTACT US

Email:   privacy@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

© 2026 Breedly. All rights reserved.
`;
  }
}
