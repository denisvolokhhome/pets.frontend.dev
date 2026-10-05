import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent {
  lastUpdated = 'October 4, 2026';

  downloadPolicy(): void {
    const content = this.getPolicyText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breedly-privacy-policy.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  private getPolicyText(): string {
    return `BREEDLY PRIVACY POLICY
Last Updated: October 4, 2026
Effective Date: October 4, 2026

================================================================================

1. INTRODUCTION

Breedly ("we," "us," or "our") operates the Breedly platform at breedly.us — a pet
breeding management service connecting responsible breeders with pet seekers,
registered and operating in the State of Maryland, United States. This Privacy
Policy explains how we collect, use, share, and protect your personal information
when you use our website and services.

By using Breedly, you agree to the collection and use of information as described
in this policy. If you do not agree, please discontinue use of our services.

Contact us with privacy questions at: privacy@breedly.us | (240) 242-9483

================================================================================

2. WHO WE ARE AND WHO THIS POLICY COVERS

Breedly serves three types of users:
- Breeders: Users who manage pets, litters (breedings), and individual offspring listings.
- Pet Seekers: Users who browse, favorite, and contact breeders about available offspring.
- Guests: Unauthenticated visitors who may browse listings and initiate contact with
  breeders. Guests who send a message are automatically registered as Pet Seeker accounts.

================================================================================

3. INFORMATION WE COLLECT

3.1 Information You Provide Directly

Account Registration:
- Email address (required, unique identifier)
- Password (stored as a secure hash — never in plain text). If you sign up with
  Google, you do not need a password; you can set one later in Settings.
- Full name (optional)
- Phone number (optional)
- User type: Breeder or Pet Seeker

Breeder Profile Information:
- Breedery name
- Breedery description
- Profile image
- Search tags
- Social media links (Facebook, YouTube, Twitter, LinkedIn)
- Website URL

Location Information (Breeders):
- Physical address (street, city, state, country, postcode)
- Location type
- Geographic coordinates (latitude/longitude) derived from your address

Pet and Offspring Listings (Breeders):
- Pet names, dates of birth, gender, weight, breed, description
- Health records: microchip numbers, vaccination status, health certificates,
  deworming records, birth certificates
- Offspring details: name, gender, date of birth, price, availability status,
  colour markings, description
- Images uploaded for pets and offspring

Messages:
- Message content between pet seekers and breeders
- Thread identifiers for conversation grouping
- Context linking to specific offspring listings

Billing Information (Breeders on paid plans):
- Subscription plan selection
- Payment is processed by Stripe — we do not store raw card numbers
- We store encrypted Stripe customer IDs and subscription IDs
- Invoice records: amount, currency, billing period, payment status

3.2 Information Collected Automatically

When you use Breedly, we automatically collect:
- IP address (logged in billing audit records and used to rate-limit sign-in,
  registration, and messaging for security purposes — see Section 10)
- Browser type and version
- Device type and operating system
- Pages visited and features used
- Session duration and interaction patterns
- Cookie data (see Section 9)

3.3 Information from Third Parties

Google Sign-In (if you create an account or sign in with your Google account):
- Your name, email address, and Google account identifier
- Confirmation from Google that your email address is verified
- OAuth provider name

We do not receive your Google password. We store the OAuth provider name and
your Google account identifier to link your Google account to your Breedly
account. If you sign up with Google, you can set a Breedly password later in
Settings. Google's processing of your information is governed by the Google
Privacy Policy: https://policies.google.com/privacy

================================================================================

4. HOW WE USE YOUR INFORMATION

We use your information to:

Service Delivery:
- Create and manage your account
- Display your breeder profile and listings to pet seekers
- Enable messaging between breeders and pet seekers
- Process subscription payments via Stripe
- Send in-app notifications (new messages, favorites added)
- Enable location-based search for nearby breeders and offspring

Email Communications:
We send transactional emails through an email delivery (SMTP) provider, including:
- Account verification and password reset emails
- A welcome email when you create an account
- Activity notifications when you receive a new message and, for breeders, when
  a pet seeker adds one of your offspring to Favorites
You can manage activity notification preferences in your account settings.
Account verification, password reset, and other security-related emails are
required to operate your account and cannot be turned off.

Security and Fraud Prevention:
- Verify account identity
- Detect and prevent fraudulent activity
- Rate-limit sign-in attempts, registration, and messaging to protect accounts
  from brute-force attacks and spam
- Maintain billing audit logs (IP address, operation type, outcome)
- Encrypt sensitive billing identifiers at rest using AES-256-GCM

Platform Improvement:
- Analyze usage patterns to improve features
- Identify and fix technical issues

Legal Compliance:
- Comply with applicable laws and regulations
- Respond to lawful requests from authorities

Privacy-Protective Measures:
- Breeder location coordinates are offset by 0.5-1.5 miles on public maps
  to protect exact address privacy while enabling proximity search.

================================================================================

5. LEGAL BASIS FOR PROCESSING

Breedly is a US-based service operating under US law, registered in the State of
Maryland. We do not specifically target users outside the United States.

Our legal bases for processing personal information under applicable US law are:

- Contractual necessity: We process your personal information to provide the
  Breedly service you signed up for.
- Legitimate business interests: We process certain data for security monitoring,
  fraud prevention, platform analytics, and service improvement.
- Legal obligation: We may process or retain data as required to comply with
  applicable federal or state laws.
- Consent: Where required by law, we rely on your explicit consent.

================================================================================

6. DATA SHARING AND THIRD PARTIES

We share your data with:

Stripe (Payment Processing): https://stripe.com/privacy
Google (Authentication): https://policies.google.com/privacy
Email Delivery Provider (Transactional Email): processes your email address and
  the content of transactional emails to deliver them.
Nominatim / OpenStreetMap (Geocoding): https://wiki.osmfoundation.org/wiki/Privacy_Policy
Hosting and Infrastructure: Cloud servers located in the United States.

We do NOT sell your personal data to third parties.
We do NOT share your data with advertisers.

================================================================================

7. DATA LOCATION AND TRANSFERS

All personal information is collected, stored, and processed in the United States.
Breedly is intended exclusively for use within the United States.

================================================================================

8. DATA RETENTION

- Account data: Removed within 30 days of account deletion.
- Pet and offspring listings: Soft-deleted while account is active.
- Messages: Permanently removed after 90 days of soft-deletion.
- Billing records: Retained for 7 years for legal compliance.
- Audit logs: Retained for 12 months.
- Rate-limiting data: IP addresses used to rate-limit sign-in, registration,
  and messaging are kept only briefly.
- Geocoding cache: Cached for up to 24 hours.

================================================================================

9. COOKIES AND TRACKING

We use cookies to maintain your login session, remember cookie consent, and
improve platform performance. You can manage cookies through your browser settings.

================================================================================

10. SECURITY

We protect your data using HTTPS, bcrypt password hashing, AES-256-GCM encryption
for billing identifiers, JWT authentication, and role-based access controls
(Breeder, Pet Seeker, Admin).

To protect accounts from brute-force attacks and the platform from spam, we
process IP addresses to rate-limit sign-in attempts, registration, and messaging.
IP address data used for rate limiting is kept only briefly.

================================================================================

11. CHILDREN'S PRIVACY

Breedly is not directed at children under 13. Contact privacy@breedly.us to
report any data collected from a child.

================================================================================

12. YOUR RIGHTS

You may request access, correction, deletion, restriction, portability, or
object to processing of your personal data. Contact privacy@breedly.us.
We will respond within 30 days.

California Residents (CCPA/CPRA): We do not sell personal information.

================================================================================

13. THIRD-PARTY LINKS

We are not responsible for the privacy practices of third-party websites linked
from our platform.

================================================================================

14. CHANGES TO THIS POLICY

We will notify registered users by email for significant changes and post the
updated policy with a new "Last Updated" date.

================================================================================

15. CONTACT US

Email:   privacy@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

(c) 2026 Breedly. All rights reserved.
`;
  }
}
