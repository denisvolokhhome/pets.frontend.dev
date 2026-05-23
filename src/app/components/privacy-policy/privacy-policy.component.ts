import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-privacy-policy',
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.css']
})
export class PrivacyPolicyComponent {
  lastUpdated = 'May 22, 2026';

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
Last Updated: May 22, 2026
Effective Date: May 22, 2026

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

Breedly serves four types of users:
- Breeders: Users who manage pets, litters (breedings), and individual offspring listings.
- Pet Seekers: Users who browse, favorite, and contact breeders about available offspring.
- Service Providers: Users who offer pet-related services (grooming, dog walking, pet
  sitting, training, boarding, and similar). Service Providers create a Service Account
  and list their services on the platform.
- Guests: Unauthenticated visitors who may browse listings and initiate contact with
  breeders. Guests who send a message are automatically registered as Pet Seeker accounts.

================================================================================

3. INFORMATION WE COLLECT

3.1 Information You Provide Directly

Account Registration:
- Email address (required, unique identifier)
- Password (stored as a secure hash — never in plain text)
- Full name (optional)
- Phone number (optional)
- User type: Breeder, Pet Seeker, or Service Provider
- Service categories selected at registration (Service Providers only)

Breeder Profile Information:
- Breedery name (your kennel or cattery name)
- Breedery description
- Profile image
- Search tags
- Social media links (Facebook, YouTube, Twitter, LinkedIn)
- Website URL

Service Provider Profile Information:
- Business or display name
- Service description and profile image
- Contact information: phone number(s), contact email, website URL, Facebook URL
- Service categories (e.g., Grooming, Dog Walking, Pet Sitting, Pet Training)

Location Information (Breeders and Service Providers):
- Physical address (street, city, state, country, postcode)
- Location type (business or service-specific location)
- Geographic coordinates (latitude/longitude) derived from your address
- Service Providers may add up to 10 service locations representing the areas
  where they offer services

Service Listings (Service Providers):
- Service title, description, and category
- Pricing information (price range and unit)
- Service locations (linked from your registered locations)
- Images uploaded for service listings

Pet and Offspring Listings (Breeders):
- Pet names, dates of birth, gender, weight, breed, description
- Health records: microchip numbers, vaccination status, health certificates,
  deworming records, birth certificates
- Offspring details: name, gender, date of birth, price, availability status,
  colour markings, description
- Images uploaded for pets and offspring

Messages:
- Message content between pet seekers, breeders, and service providers
- Thread identifiers for conversation grouping
- Context linking to specific offspring listings

Billing Information (Breeders on paid plans):
- Subscription plan selection
- Payment is processed by Stripe — we do not store raw card numbers
- We store encrypted Stripe customer IDs and subscription IDs
- Invoice records: amount, currency, billing period, payment status

3.2 Information Collected Automatically

When you use Breedly, we automatically collect:
- IP address (logged in billing audit records for security purposes)
- Browser type and version
- Device type and operating system
- Pages visited and features used
- Session duration and interaction patterns
- Cookie data (see Section 9)

3.3 Information from Third Parties

Google OAuth (if you sign in with Google):
- Email address
- Google account identifier
- OAuth provider name

We do not receive your Google password. We store only the OAuth provider name
and a provider-specific identifier to link your account.

================================================================================

4. HOW WE USE YOUR INFORMATION

We use your information to:

Service Delivery:
- Create and manage your account
- Display your breeder profile and listings to pet seekers
- Display your service provider profile and service listings to pet owners and breeders
- Enable messaging between breeders, pet seekers, and service providers
- Process subscription payments via Stripe
- Send in-app notifications (new messages, favorites added)
- Enable location-based search for nearby breeders, offspring, and service providers

Security and Fraud Prevention:
- Verify account identity
- Detect and prevent fraudulent activity
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
- Service Provider contact information (phone, email, website) is only displayed
  on their public profile and is provided voluntarily by the Service Provider.

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
- Service listings (Service Providers): Soft-deleted when removed.
- Messages: Permanently removed after 90 days of soft-deletion.
- Billing records: Retained for 7 years for legal compliance.
- Audit logs: Retained for 12 months.
- Geocoding cache: Cached for up to 24 hours.

================================================================================

9. COOKIES AND TRACKING

We use cookies to maintain your login session, remember cookie consent, and
improve platform performance. You can manage cookies through your browser settings.

================================================================================

10. SECURITY

We protect your data using HTTPS, bcrypt password hashing, AES-256-GCM encryption
for billing identifiers, JWT authentication, and role-based access controls
(Breeder, Pet Seeker, Service Provider, Admin).

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
