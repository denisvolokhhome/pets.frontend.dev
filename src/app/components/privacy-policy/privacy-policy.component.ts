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
- Breeder location coordinates are offset by 0.5–1.5 miles on public maps 
  to protect exact address privacy while enabling proximity search.
- Service Provider contact information (phone, email, website) is only displayed 
  on their public profile and is provided voluntarily by the Service Provider.

================================================================================

5. LEGAL BASIS FOR PROCESSING

Breedly is a US-based service operating under US law, registered in the State of 
Maryland. We do not specifically target users outside the United States.

Our legal bases for processing personal information under applicable US law are:

- Contractual necessity: We process your personal information to provide the 
  Breedly service you signed up for — including account management, listings, 
  messaging, and payment processing.
- Legitimate business interests: We process certain data for security monitoring, 
  fraud prevention, platform analytics, and service improvement, where those 
  interests are not overridden by your privacy rights.
- Legal obligation: We may process or retain data as required to comply with 
  applicable federal or state laws, respond to lawful government requests, or 
  enforce our Terms of Use.
- Consent: Where required by law (e.g., for non-essential cookies or marketing 
  communications), we rely on your explicit consent, which you may withdraw at 
  any time.

Note: Breedly currently operates exclusively within the United States and does 
not target users in the European Union or other jurisdictions with separate 
legal basis requirements (such as GDPR). If this changes in the future, this 
section will be updated accordingly.

================================================================================

6. DATA SHARING AND THIRD PARTIES

We share your data with:

Stripe (Payment Processing):
- We use Stripe to process subscription payments.
- Stripe receives billing information necessary to process payments.
- Stripe's privacy policy: https://stripe.com/privacy

Google (Authentication):
- If you use "Sign in with Google," Google processes your authentication.
- Google's privacy policy: https://policies.google.com/privacy

Nominatim / OpenStreetMap (Geocoding):
- We use a geocoding service to convert addresses to coordinates for map search.
- Address data is sent to the geocoding service to resolve coordinates.
- This applies to both breeder locations and service provider locations.
- OpenStreetMap privacy policy: https://wiki.osmfoundation.org/wiki/Privacy_Policy

Hosting and Infrastructure:
- Our platform runs on cloud infrastructure. Your data is stored on servers 
  located in the United States.

We do NOT sell your personal data to third parties.
We do NOT share your data with advertisers.

================================================================================

7. DATA LOCATION AND TRANSFERS

Breedly is operated from the United States and is intended exclusively for use 
within the United States. All personal information you provide is collected, 
stored, and processed in the United States.

We do not intentionally collect personal information from individuals located 
outside the United States. If you access Breedly from outside the US, you do 
so at your own discretion and your information will be transferred to and 
processed in the United States, where data protection laws may differ from 
those in your country.

Our infrastructure, databases, and third-party service providers (including 
Stripe and Google) operate primarily within the United States.

================================================================================

8. DATA RETENTION

We retain your data as follows:

- Account data: Retained while your account is active. Upon account deletion, 
  personal data is removed within 30 days.
- Pet and offspring listings: Retained while your account is active. Pets use 
  soft deletion (marked as deleted but retained for data integrity).
- Service listings (Service Providers): Retained while your account is active. 
  Deleted services are soft-deleted and excluded from public listings.
- Messages: Retained while your account is active. Deleted messages are soft-deleted 
  and permanently removed after 90 days.
- Billing records: Retained for 7 years for legal and tax compliance.
- Audit logs: Retained for 12 months for security purposes.
- Geocoding cache: Address-to-coordinate mappings cached for up to 24 hours.

================================================================================

9. COOKIES AND TRACKING

We use cookies to:
- Maintain your login session (strictly necessary)
- Remember your cookie consent preference (strictly necessary)
- Improve platform performance and user experience (functional)

We display a cookie consent banner when you first visit Breedly. By clicking 
"Got it," you consent to our use of cookies as described above.

You can manage cookies through your browser settings. Disabling cookies may 
affect your ability to log in and use certain features.

================================================================================

10. SECURITY

We protect your data using:
- HTTPS encryption for all data in transit
- Bcrypt hashing for passwords (never stored in plain text)
- AES-256-GCM encryption for sensitive billing identifiers (Stripe IDs)
- JWT-based authentication with configurable token expiry
- Role-based access controls (Breeder, Pet Seeker, Service Provider, Admin)
- Billing audit logs for security-relevant operations
- Admin access protected by API key (separate from user authentication)

No system is 100% secure. In the event of a data breach, we will notify 
affected users as required by applicable law.

================================================================================

11. CHILDREN'S PRIVACY

Breedly is not directed at children under the age of 13. 
We do not knowingly collect personal data from children. If you believe a 
child has provided us with personal data, please contact us at privacy@breedly.us 
and we will delete it promptly.

================================================================================

12. YOUR RIGHTS

Depending on your location, you may have the following rights:

- Right to Access: Request a copy of the personal data we hold about you.
- Right to Correction: Request correction of inaccurate or incomplete data.
- Right to Deletion: Request deletion of your personal data ("right to be forgotten").
- Right to Restrict Processing: Request that we limit how we use your data.
- Right to Data Portability: Request your data in a machine-readable format.
- Right to Object: Object to processing based on legitimate interests.
- Right to Withdraw Consent: Withdraw consent at any time where processing is 
  based on consent (e.g., marketing emails, non-essential cookies).
- Right to Lodge a Complaint: Contact your local data protection authority.

To exercise any of these rights, contact us at: privacy@breedly.us
We will respond within 30 days of receiving your request.

California Residents (CCPA/CPRA):
You have the right to know what personal information we collect, the right to 
delete your personal information, and the right to opt-out of the sale of your 
personal information. We do not sell personal information.

================================================================================

13. THIRD-PARTY LINKS

Our platform may contain links to third-party websites (e.g., breeder social media 
profiles, service provider websites). We are not responsible for the privacy 
practices of those sites. We encourage you to review their privacy policies 
before providing any personal data.

================================================================================

14. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. When we make material changes, 
we will notify you by:
- Posting the updated policy on this page with a new "Last Updated" date
- Sending an email notification to registered users (for significant changes)

Your continued use of Breedly after changes are posted constitutes acceptance 
of the updated policy.

================================================================================

15. CONTACT US

For privacy-related questions, requests, or concerns:

Email:   privacy@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

© 2026 Breedly. All rights reserved.
`;

================================================================================

1. INTRODUCTION

Breedly ("we," "us," or "our") operates the Breedly platform at breedly.us — a pet 
breeding management service connecting responsible breeders with pet seekers, 
registered and operating in the State of Maryland, United States. This Privacy 
Policy explains how we collect, use, share, and protect your personal information 
when you use our website and services.

By using Breedly, you agree to the collection and use of information as described 
in this policy. If you do not agree, please discontinue use of our services.

Contact us with privacy questions at: privacy@breedly.com | (240) 242-9483

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
- Password (stored as a secure hash — never in plain text)
- Full name (optional)
- Phone number (optional)
- User type: Breeder or Pet Seeker

Breeder Profile Information:
- Breedery name (your kennel or cattery name)
- Breedery description
- Profile image
- Search tags
- Social media links (Facebook, YouTube, Twitter, LinkedIn)
- Website URL

Location Information (Breeders):
- Physical address (street, city, state, country, postcode)
- Location type (business or pet-specific location)
- Geographic coordinates (latitude/longitude) derived from your address

Pet and Offspring Listings:
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
- Enable messaging between breeders and pet seekers
- Process subscription payments via Stripe
- Send in-app notifications (new messages, favorites added)
- Enable location-based search for nearby breeders and offspring

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
- Breeder location coordinates are offset by 0.5–1.5 miles on public maps 
  to protect exact address privacy while enabling proximity search.

================================================================================

5. LEGAL BASIS FOR PROCESSING

Breedly is a US-based service operating under US law, registered in the State of 
Maryland. We do not specifically target users outside the United States.

Our legal bases for processing personal information under applicable US law are:

- Contractual necessity: We process your personal information to provide the 
  Breedly service you signed up for — including account management, listings, 
  messaging, and payment processing.
- Legitimate business interests: We process certain data for security monitoring, 
  fraud prevention, platform analytics, and service improvement, where those 
  interests are not overridden by your privacy rights.
- Legal obligation: We may process or retain data as required to comply with 
  applicable federal or state laws, respond to lawful government requests, or 
  enforce our Terms of Use.
- Consent: Where required by law (e.g., for non-essential cookies or marketing 
  communications), we rely on your explicit consent, which you may withdraw at 
  any time.

Note: Breedly currently operates exclusively within the United States and does 
not target users in the European Union or other jurisdictions with separate 
legal basis requirements (such as GDPR). If this changes in the future, this 
section will be updated accordingly.

================================================================================

6. DATA SHARING AND THIRD PARTIES

We share your data with:

Stripe (Payment Processing):
- We use Stripe to process subscription payments.
- Stripe receives billing information necessary to process payments.
- Stripe's privacy policy: https://stripe.com/privacy

Google (Authentication):
- If you use "Sign in with Google," Google processes your authentication.
- Google's privacy policy: https://policies.google.com/privacy

Nominatim / OpenStreetMap (Geocoding):
- We use a geocoding service to convert addresses to coordinates for map search.
- Address data is sent to the geocoding service to resolve coordinates.
- OpenStreetMap privacy policy: https://wiki.osmfoundation.org/wiki/Privacy_Policy

Hosting and Infrastructure:
- Our platform runs on cloud infrastructure. Your data is stored on servers 
  located in the United States.

We do NOT sell your personal data to third parties.
We do NOT share your data with advertisers.

================================================================================

7. DATA LOCATION AND TRANSFERS

Breedly is operated from the United States and is intended exclusively for use 
within the United States. All personal information you provide is collected, 
stored, and processed in the United States.

We do not intentionally collect personal information from individuals located 
outside the United States. If you access Breedly from outside the US, you do 
so at your own discretion and your information will be transferred to and 
processed in the United States, where data protection laws may differ from 
those in your country.

Our infrastructure, databases, and third-party service providers (including 
Stripe and Google) operate primarily within the United States.

================================================================================

8. DATA RETENTION

We retain your data as follows:

- Account data: Retained while your account is active. Upon account deletion, 
  personal data is removed within 30 days.
- Pet and offspring listings: Retained while your account is active. Pets use 
  soft deletion (marked as deleted but retained for data integrity).
- Messages: Retained while your account is active. Deleted messages are soft-deleted 
  (marked with a deletion timestamp) and permanently removed after 90 days.
- Billing records: Retained for 7 years for legal and tax compliance.
- Audit logs: Retained for 12 months for security purposes.
- Geocoding cache: Address-to-coordinate mappings cached for up to 24 hours.

================================================================================

9. COOKIES AND TRACKING

We use cookies to:
- Maintain your login session (strictly necessary)
- Remember your cookie consent preference (strictly necessary)
- Improve platform performance and user experience (functional)

We display a cookie consent banner when you first visit Breedly. By clicking 
"Got it," you consent to our use of cookies as described above.

You can manage cookies through your browser settings. Disabling cookies may 
affect your ability to log in and use certain features.

================================================================================

10. SECURITY

We protect your data using:
- HTTPS encryption for all data in transit
- Bcrypt hashing for passwords (never stored in plain text)
- AES-256-GCM encryption for sensitive billing identifiers (Stripe IDs)
- JWT-based authentication with configurable token expiry
- Role-based access controls (Breeder, Pet Seeker, Admin)
- Billing audit logs for security-relevant operations
- Admin access protected by API key (separate from user authentication)

No system is 100% secure. In the event of a data breach, we will notify 
affected users as required by applicable law.

================================================================================

11. CHILDREN'S PRIVACY

Breedly is not directed at children under the age of 13. 
We do not knowingly collect personal data from children. If you believe a 
child has provided us with personal data, please contact us at privacy@breedly.com 
and we will delete it promptly.

================================================================================

12. YOUR RIGHTS

Depending on your location, you may have the following rights:

- Right to Access: Request a copy of the personal data we hold about you.
- Right to Correction: Request correction of inaccurate or incomplete data.
- Right to Deletion: Request deletion of your personal data ("right to be forgotten").
- Right to Restrict Processing: Request that we limit how we use your data.
- Right to Data Portability: Request your data in a machine-readable format.
- Right to Object: Object to processing based on legitimate interests.
- Right to Withdraw Consent: Withdraw consent at any time where processing is 
  based on consent (e.g., marketing emails, non-essential cookies).
- Right to Lodge a Complaint: Contact your local data protection authority.

To exercise any of these rights, contact us at: privacy@breedly.com
We will respond within 30 days of receiving your request.

California Residents (CCPA/CPRA):
You have the right to know what personal information we collect, the right to 
delete your personal information, and the right to opt-out of the sale of your 
personal information. We do not sell personal information.

================================================================================

13. THIRD-PARTY LINKS

Our platform may contain links to third-party websites (e.g., breeder social media 
profiles). We are not responsible for the privacy practices of those sites. 
We encourage you to review their privacy policies before providing any personal data.

================================================================================

14. CHANGES TO THIS POLICY

We may update this Privacy Policy from time to time. When we make material changes, 
we will notify you by:
- Posting the updated policy on this page with a new "Last Updated" date
- Sending an email notification to registered users (for significant changes)

Your continued use of Breedly after changes are posted constitutes acceptance 
of the updated policy.

================================================================================

15. CONTACT US

For privacy-related questions, requests, or concerns:

Email:   privacy@breedly.com
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

© 2026 Breedly. All rights reserved.
`;
  }
}
