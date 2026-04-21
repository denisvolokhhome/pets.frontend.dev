import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-breeder-agreement',
  templateUrl: './breeder-agreement.component.html',
  styleUrls: ['./breeder-agreement.component.css']
})
export class BreederAgreementComponent {
  lastUpdated = 'April 20, 2026';

  downloadAgreement(): void {
    const blob = new Blob([this.getText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breedly-breeder-agreement.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  private getText(): string {
    return `BREEDLY BREEDER AGREEMENT
Last Updated: April 20, 2026

This Breeder Agreement ("Agreement") governs your use of the Breedly platform
as a Breeder. By registering a Breeder account or listing any animal on Breedly,
you agree to be bound by this Agreement in addition to the Terms of Use.

================================================================================

1. BREEDER ELIGIBILITY

To list animals on Breedly, you represent and warrant that:

1.1 You are at least 18 years of age.

1.2 You are legally authorized to sell or transfer ownership of the animals
    you list, either as the owner or as an authorized agent of the owner.

1.3 You comply with all applicable federal, state, and local laws governing
    animal breeding, sale, and transfer in your jurisdiction, including but
    not limited to:
    - The Animal Welfare Act (AWA), 7 U.S.C. § 2131 et seq.
    - USDA licensing requirements for commercial breeders (where applicable)
    - Maryland Code, Agriculture Article, Title 2B (Pet Dealer licensing)
    - Any applicable state breeder licensing or registration requirements

1.4 You hold all required licenses, permits, and registrations required by
    your state and local jurisdiction to breed and sell animals.

================================================================================

2. LISTING OBLIGATIONS

2.1 Accuracy
You agree to provide complete, accurate, and truthful information for every
listing, including:
- Correct breed, date of birth, gender, and weight
- Accurate health status and documented health records
- Honest availability status (Available, Reserved, Sold, Archived)
- Accurate pricing with no hidden fees

2.2 Health Documentation
For each listed offspring, you agree to:
- Accurately represent vaccination status and provide documentation upon request
- Disclose any known health conditions, genetic disorders, or defects
- Provide microchip information where applicable
- Provide a health certificate from a licensed veterinarian where required by law

2.3 Timely Updates
You agree to update listing status promptly when an animal is reserved, sold,
or no longer available. Stale or inaccurate listings harm pet seekers and
damage the integrity of the platform.

================================================================================

3. ANIMAL WELFARE STANDARDS

You agree to maintain the following standards for all animals listed on Breedly:

3.1 Animals must receive adequate food, water, shelter, and veterinary care.

3.2 Animals must not be listed if they are in poor health, injured, or
    otherwise unfit for transfer without full disclosure of their condition.

3.3 Animals must be of appropriate age for transfer. Puppies and kittens
    must be at least 8 weeks old before transfer (or the minimum age required
    by applicable state law, whichever is greater).

3.4 You must not list animals obtained from puppy mills, kitten mills, or
    any operation that does not meet minimum animal welfare standards.

3.5 Breedly reserves the right to remove listings and suspend accounts where
    animal welfare concerns are identified, and to report suspected violations
    to the USDA, ASPCA, or relevant state authorities.

================================================================================

4. TRANSACTION RESPONSIBILITIES

4.1 Breedly is a marketplace platform. We are not a party to any transaction
    between you and a pet seeker. You are solely responsible for:
    - Completing the sale or transfer of any animal
    - Providing accurate health records and documentation to the buyer
    - Complying with any applicable bill of sale or transfer requirements
    - Honoring any health guarantees you represent to buyers

4.2 You agree not to conduct transactions outside the Breedly platform in
    order to circumvent platform fees or policies.

4.3 You are responsible for collecting and remitting any applicable sales
    tax on animal sales as required by your jurisdiction.

================================================================================

5. PLATFORM FEES AND SUBSCRIPTIONS

5.1 Breedly offers subscription plans that provide access to listing features.
    Subscription terms, pricing, and included features are described on the
    pricing page and are governed by Section 8 of the Terms of Use.

5.2 Breedly reserves the right to modify subscription pricing with reasonable
    notice to active subscribers.

================================================================================

6. CONTENT LICENSE

By submitting listings, images, and profile content to Breedly, you grant
Breedly a non-exclusive, royalty-free, worldwide license to display, store,
and use that content to operate and promote the platform, including use in
search results, featured listings, and marketing materials.

You retain ownership of all content you submit.

================================================================================

7. REPRESENTATIONS AND WARRANTIES

You represent and warrant that:
- All information you provide is accurate and not misleading
- You have the legal right to list and sell the animals you post
- Your listings do not infringe any third-party rights
- You will comply with all applicable laws throughout the transaction

================================================================================

8. TERMINATION

Breedly may terminate or suspend your Breeder account at any time for:
- Violation of this Agreement, the Terms of Use, or the AUP
- Fraudulent, deceptive, or harmful conduct
- Animal welfare violations
- Failure to maintain required licenses or permits
- Any conduct that harms users or the platform

Upon termination, your listings will be removed and you may not create a
new account without written permission from Breedly.

================================================================================

9. GOVERNING LAW

This Agreement is governed by the laws of the State of Maryland, United States.

================================================================================

10. CONTACT US

Email:   legal@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

© 2026 Breedly. All rights reserved.
`;
  }
}
