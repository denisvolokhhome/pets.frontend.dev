import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  styleUrls: ['./terms-of-use.component.css']
})
export class TermsOfUseComponent {
  lastUpdated = 'May 22, 2026';

  downloadTerms(): void {
    const content = this.getTermsText();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breedly-terms-of-use.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  private getTermsText(): string {
    return `BREEDLY TERMS OF USE
Last Updated: May 22, 2026
Effective Date: May 22, 2026

================================================================================

1. ACCEPTANCE OF TERMS

By accessing or using the Breedly platform at breedly.us ("Service"), you agree
to be bound by these Terms of Use ("Terms"). If you do not agree, do not use
the Service.

Breedly is operated by Breedly, registered in the State of Maryland, United States.

Contact: legal@breedly.us | (240) 242-9483 | https://breedly.us

================================================================================

2. WHO MAY USE BREEDLY

You must be at least 18 years old to create an account or use the Service.
Breedly is intended for use within the United States only.

================================================================================

3. USER ACCOUNTS

3.1 Account Types
- Breeder accounts: For individuals or businesses that breed and list animals.
- Pet Seeker accounts: For individuals looking to acquire an offspring.
- Service Provider accounts: For individuals or businesses offering pet-related
  services (grooming, dog walking, cat sitting, pet sitting, pet training, pet
  boarding, veterinary services, pet photography, pet transport, pet daycare, and
  similar). Service Providers must select at least one service category at registration.
- Guest access: Limited browsing and messaging without a registered account.
  Guests who send a message are automatically registered as Pet Seeker accounts.

3.2 Account Responsibilities
- You are responsible for maintaining the confidentiality of your login credentials.
- You are responsible for all activity that occurs under your account.
- You must provide accurate and truthful information when registering.
- Notify us immediately of any unauthorized use at legal@breedly.us.

3.3 Account Termination
We reserve the right to suspend or permanently ban accounts that violate these Terms.

================================================================================

4. BREEDER RESPONSIBILITIES

4.1 Accurate Listings
Provide truthful, accurate, and complete information about all pets and offspring.
Only list animals that are genuinely available. Keep listing status current.

4.2 Animal Welfare
Comply with all applicable laws regarding animal breeding, sale, and welfare.
Accurately represent the health status of all animals.

4.3 Honest Communication
Respond to messages in good faith. Honor commitments to pet seekers.
Do not engage in deceptive pricing or misrepresentation.

4.4 Location Accuracy
Provide accurate location information. Breedly offsets displayed map coordinates
by 0.5-1.5 miles to protect your exact address privacy.

================================================================================

5. PET SEEKER RESPONSIBILITIES

- Use the platform in good faith when contacting breeders.
- Not submit false inquiries or abuse the messaging system.
- Conduct your own due diligence before acquiring any animal.
- Comply with all applicable laws regarding animal ownership.

================================================================================

6. SERVICE PROVIDER RESPONSIBILITIES

6.1 Accurate Service Listings
Provide truthful, accurate, and complete information about all services offered.
Only list services you are genuinely able to provide. Keep service status current.

6.2 Licensing and Compliance
Comply with all applicable laws and regulations governing the services you offer.
Maintain any required professional licenses, certifications, or permits.

6.3 Honest Communication
Respond to messages in good faith. Honor commitments to clients.
Do not engage in deceptive pricing or misrepresentation.

6.4 Location Accuracy
Provide accurate location information for the areas where you offer services.

6.5 Contact Information
Contact information you provide will be displayed publicly on your Service Provider
profile. You are responsible for ensuring it is accurate and up to date.

================================================================================

7. PROHIBITED CONDUCT

You may not use Breedly to:

- Post false, misleading, or fraudulent listings or information.
- List animals obtained through illegal means.
- Send abusive, threatening, harassing, hateful, or harmful messages.
  *** IMMEDIATE PERMANENT BAN with no right of appeal. ***
- Upload, share, or submit pornographic, sexually explicit, or obscene content.
  *** IMMEDIATE PERMANENT BAN and potential CIVIL AND CRIMINAL LIABILITY
  under 18 U.S.C. ss 1460 and Maryland obscenity statutes. ***
- Scrape or systematically extract data without written permission.
- Attempt to gain unauthorized access to any part of the Service.
- Use the Service for any unlawful purpose.
- Impersonate another person or entity.
- Transmit spam, malware, or harmful code.
- Sell or transfer your account to another person.

================================================================================

8. CONTENT AND INTELLECTUAL PROPERTY

8.1 Your Content
You retain ownership of content you submit. By submitting, you grant Breedly a
non-exclusive, royalty-free license to display and store it to operate the Service.

8.2 Content Standards
All content must be accurate, not infringe third-party rights, and not contain
offensive or illegal material.

8.3 Breedly's Intellectual Property
The Breedly name, logo, and software are owned by Breedly. No copying without
written permission.

================================================================================

9. PAYMENTS AND SUBSCRIPTIONS

9.1 Subscription Plans
Certain features require a paid subscription. Service Provider accounts are
currently free; paid plans may be introduced in the future.

9.2 Payment Processing
All payments are processed by Stripe (https://stripe.com/legal).
Breedly does not store raw payment card details.

9.3 Cancellation and Refunds
You may cancel at any time through account settings. Cancellation takes effect
at the end of the current billing period. No refunds for partial periods.

================================================================================

10. DISCLAIMERS

10.1 Platform Role
Breedly connects breeders, pet seekers, and service providers. We do not breed,
sell, or take custody of animals, and do not provide pet services directly.
We are not a party to any transaction or service arrangement between users.

10.2 No Warranty
THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.

10.3 Animal Transactions
Breedly does not guarantee the health or suitability of any animal listed.
Pet seekers are solely responsible for their own due diligence.

10.4 Pet Services
Breedly does not verify credentials, licenses, or quality of service providers.
Pet owners are solely responsible for their own due diligence before engaging
any service provider. Breedly is not liable for harm arising from services
arranged through the platform.

================================================================================

11. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY LAW, BREEDLY SHALL NOT BE LIABLE FOR ANY
INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING
DISPUTES BETWEEN USERS, ANIMAL HEALTH ISSUES, HARM FROM PET SERVICES, OR
UNAUTHORIZED ACCOUNT ACCESS.

OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO BREEDLY IN THE
12 MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.

================================================================================

12. INDEMNIFICATION

You agree to indemnify Breedly from claims arising from your use of the Service,
violation of these Terms, or content you submit.

================================================================================

13. THIRD-PARTY SERVICES

- Stripe (payment): https://stripe.com/legal
- Google (authentication): https://policies.google.com/terms
- OpenStreetMap / Nominatim (geocoding): https://www.openstreetmap.org/copyright

================================================================================

14. MODIFICATIONS TO THE SERVICE AND TERMS

We may update these Terms at any time. Material changes will be posted with a
new "Last Updated" date and emailed to registered users. Continued use constitutes
acceptance.

================================================================================

15. GOVERNING LAW AND DISPUTES

These Terms are governed by the laws of the State of Maryland, United States.
Disputes shall be resolved in the courts of Maryland.

================================================================================

16. CONTACT US

Email:   legal@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

(c) 2026 Breedly. All rights reserved.
`;
  }
}
