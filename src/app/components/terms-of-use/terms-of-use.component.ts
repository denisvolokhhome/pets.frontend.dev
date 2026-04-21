import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-terms-of-use',
  templateUrl: './terms-of-use.component.html',
  styleUrls: ['./terms-of-use.component.css']
})
export class TermsOfUseComponent {
  lastUpdated = 'April 20, 2026';

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
Last Updated: April 20, 2026
Effective Date: April 20, 2026

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
By using Breedly, you represent and warrant that you meet this requirement.

Breedly is intended for use within the United States only.

================================================================================

3. USER ACCOUNTS

3.1 Account Types
- Breeder accounts: For individuals or businesses that breed and list animals.
- Pet Seeker accounts: For individuals looking to acquire an offspring.
- Guest access: Limited browsing and messaging without a registered account.
  Guests who send a message are automatically registered as Pet Seeker accounts.

3.2 Account Responsibilities
- You are responsible for maintaining the confidentiality of your login credentials.
- You are responsible for all activity that occurs under your account.
- You must provide accurate and truthful information when registering.
- You must promptly update your account information if it changes.
- You must notify us immediately of any unauthorized use of your account at
  legal@breedly.us or (240) 242-9483.

3.3 Account Termination
We reserve the right to suspend or permanently ban accounts that violate these Terms,
engage in fraudulent activity, send abusive or harmful messages, upload prohibited 
content, or harm other users or the platform. Bans may be issued without prior 
warning for serious violations.

================================================================================

4. BREEDER RESPONSIBILITIES

Breeders using Breedly agree to:

4.1 Accurate Listings
- Provide truthful, accurate, and complete information about all pets and offspring.
- Only list animals that are genuinely available.
- Keep listing status (Available, Reserved, Sold, Archived) current and accurate.
- Use accurate breed, age, gender, health, and pricing information.

4.2 Animal Welfare
- Comply with all applicable federal, state, and local laws regarding animal
  breeding, sale, and welfare.
- Maintain appropriate care standards for all animals listed on the platform.
- Accurately represent the health status of animals, including vaccination records,
  microchip information, and health certificates.

4.3 Honest Communication
- Respond to messages from pet seekers in good faith.
- Honor commitments made to pet seekers regarding reserved or sold offspring.
- Not engage in deceptive pricing, bait-and-switch tactics, or misrepresentation.

4.4 Location Accuracy
- Provide accurate location information for your breedery.
- Note: Breedly offsets displayed map coordinates by 0.5–1.5 miles to protect
  your exact address privacy. Your full address is only shared as you choose.

================================================================================

5. PET SEEKER RESPONSIBILITIES

Pet Seekers using Breedly agree to:

- Use the platform in good faith when contacting breeders.
- Not submit false inquiries or abuse the messaging system.
- Conduct their own due diligence before acquiring any animal.
- Comply with all applicable laws regarding animal ownership in their jurisdiction.

================================================================================

6. PROHIBITED CONDUCT

You may not use Breedly to:

- Post false, misleading, or fraudulent listings or information.
- List animals obtained through illegal means or from unlicensed operations
  where licensing is required by law.
- Send abusive, threatening, harassing, hateful, or harmful messages to other users.
  *** Any abusive or harmful communication will result in an IMMEDIATE PERMANENT BAN
  of your account with no right of appeal. ***
- Upload, share, or submit pornographic, sexually explicit, or obscene images or 
  content of any kind.
  *** Uploading pornographic or sexually explicit content will result in an IMMEDIATE 
  PERMANENT BAN of your account and may expose you to CIVIL AND CRIMINAL LEGAL 
  LIABILITY under applicable federal and state law, including but not limited to 
  18 U.S.C. § 1460 and Maryland obscenity statutes. We will cooperate fully with 
  law enforcement investigations. ***
- Scrape, crawl, or systematically extract data from the platform without
  written permission.
- Attempt to gain unauthorized access to any part of the Service or its systems.
- Use the Service for any unlawful purpose or in violation of any applicable law.
- Impersonate another person or entity.
- Transmit spam, malware, or any harmful code.
- Circumvent or attempt to circumvent any security or access control measures.
- Sell or transfer your account to another person.

Violations of this section may result in an IMMEDIATE PERMANENT ACCOUNT BAN, 
removal of all content, and referral to law enforcement where applicable. 
Breedly reserves the right to take legal action to recover damages caused by 
prohibited conduct.

================================================================================

7. CONTENT AND INTELLECTUAL PROPERTY

7.1 Your Content
You retain ownership of content you submit to Breedly (listings, images, messages,
profile information). By submitting content, you grant Breedly a non-exclusive,
royalty-free, worldwide license to display, store, and use that content solely
to operate and improve the Service.

7.2 Content Standards
All content you submit must:
- Be accurate and not misleading.
- Not infringe any third-party intellectual property rights.
- Not contain offensive, abusive, or illegal material.
- Not include personal contact information in public listing descriptions
  (use the messaging system instead).

7.3 Breedly's Intellectual Property
The Breedly name, logo, platform design, and all software are owned by Breedly.
You may not copy, reproduce, or create derivative works from our intellectual
property without written permission.

================================================================================

8. PAYMENTS AND SUBSCRIPTIONS (BREEDERS)

8.1 Subscription Plans
Certain features of Breedly require a paid subscription. Subscription details,
pricing, and included features are described on the pricing page.

8.2 Payment Processing
All payments are processed by Stripe. By subscribing, you agree to Stripe's
Terms of Service (https://stripe.com/legal) and authorize Stripe to charge
your payment method on a recurring basis per your selected plan.

8.3 Billing
- Subscriptions renew automatically at the end of each billing period.
- You will receive invoice records for all charges.
- Breedly does not store your raw payment card details.

8.4 Cancellation and Refunds
- You may cancel your subscription at any time through your account settings.
- Cancellation takes effect at the end of the current billing period.
- Refunds are not provided for partial billing periods unless required by law.

================================================================================

9. DISCLAIMERS

9.1 Platform Role
Breedly is a marketplace platform connecting breeders and pet seekers. We do not
breed, sell, or take custody of any animals. We are not a party to any transaction
between breeders and pet seekers.

9.2 No Warranty
THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.

We do not warrant that:
- The Service will be uninterrupted or error-free.
- Listings are accurate, complete, or current.
- Any animal listed meets your specific requirements.

9.3 Animal Transactions
Breedly does not guarantee the health, temperament, or suitability of any animal
listed on the platform. Pet seekers are solely responsible for conducting their
own due diligence before acquiring any animal.

================================================================================

10. LIMITATION OF LIABILITY

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, BREEDLY SHALL NOT BE LIABLE
FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING
FROM YOUR USE OF THE SERVICE, INCLUDING BUT NOT LIMITED TO:

- Loss of data or profits.
- Disputes between breeders and pet seekers.
- Animal health issues or misrepresentations by breeders.
- Unauthorized access to your account.

OUR TOTAL LIABILITY TO YOU FOR ANY CLAIM ARISING FROM THESE TERMS OR YOUR USE
OF THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO BREEDLY IN THE 12 MONTHS
PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.

================================================================================

11. INDEMNIFICATION

You agree to indemnify and hold harmless Breedly, its officers, employees, and
agents from any claims, damages, losses, or expenses (including reasonable
attorneys' fees) arising from:

- Your use of the Service.
- Your violation of these Terms.
- Your violation of any applicable law or third-party rights.
- Content you submit to the platform.

================================================================================

12. THIRD-PARTY SERVICES

Breedly integrates with third-party services including:
- Stripe (payment processing) — https://stripe.com/legal
- Google (authentication) — https://policies.google.com/terms
- OpenStreetMap / Nominatim (geocoding) — https://www.openstreetmap.org/copyright

Your use of these services is subject to their respective terms. Breedly is not
responsible for the practices or content of third-party services.

================================================================================

13. MODIFICATIONS TO THE SERVICE AND TERMS

13.1 Service Changes
We reserve the right to modify, suspend, or discontinue any part of the Service
at any time with or without notice.

13.2 Terms Changes
We may update these Terms from time to time. When we make material changes, we will:
- Post the updated Terms on this page with a new "Last Updated" date.
- Notify registered users by email for significant changes.

Your continued use of the Service after changes are posted constitutes acceptance
of the updated Terms.

================================================================================

14. GOVERNING LAW AND DISPUTES

These Terms are governed by the laws of the State of Maryland, United States,
without regard to its conflict of law provisions.

Any dispute arising from these Terms or your use of the Service shall be resolved
through good-faith negotiation first. If unresolved, disputes shall be subject to
the exclusive jurisdiction of the courts located in Maryland, United States.

================================================================================

15. CONTACT US

For questions about these Terms:

Email:   legal@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

© 2026 Breedly. All rights reserved.
`;
  }
}
