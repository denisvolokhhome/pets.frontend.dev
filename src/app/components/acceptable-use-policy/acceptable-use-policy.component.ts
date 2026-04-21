import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-acceptable-use-policy',
  templateUrl: './acceptable-use-policy.component.html',
  styleUrls: ['./acceptable-use-policy.component.css']
})
export class AcceptableUsePolicyComponent {
  lastUpdated = 'April 20, 2026';

  downloadPolicy(): void {
    const blob = new Blob([this.getText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'breedly-acceptable-use-policy.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  private getText(): string {
    return `BREEDLY ACCEPTABLE USE POLICY (AUP)
Last Updated: April 20, 2026

This Acceptable Use Policy ("AUP") governs all content submitted to the Breedly
platform at breedly.us. It supplements the Terms of Use and applies to all users
including Breeders, Pet Seekers, and Guests.

Violations may result in content removal, account suspension, or permanent ban.

================================================================================

1. IMAGE AND MEDIA STANDARDS

1.1 Permitted Images
- Clear, accurate photographs of the actual animal being listed
- Health document scans (vaccination records, health certificates, microchip docs)
- Breeder facility or environment photos that accurately represent conditions
- Profile photos that clearly identify the breeder or breedery

1.2 Prohibited Images
The following are strictly prohibited and will result in immediate content
removal and permanent account ban:

- Pornographic, sexually explicit, or obscene images of any kind
- Images depicting animal abuse, neglect, or inhumane conditions
- Images of animals in distress, injured, or in unsafe environments
- Misleading images (e.g., stock photos presented as the actual animal)
- Images of animals that are not the ones being listed
- Images containing watermarks or branding from competing platforms
- Images that violate any third-party copyright

Uploading pornographic or sexually explicit content may also expose you to
civil and criminal legal liability under 18 U.S.C. § 1460 and Maryland
obscenity statutes. Breedly will cooperate fully with law enforcement.

================================================================================

2. LISTING CONTENT STANDARDS

2.1 Required Accuracy
All listing information must be truthful and accurate, including:
- Animal name, breed, date of birth, gender, and weight
- Health status, vaccination records, and microchip information
- Availability status (Available, Reserved, Sold, Archived)
- Pricing — no hidden fees or bait-and-switch pricing
- Location — must reflect the actual location of the animal

2.2 Prohibited Listing Content
- False or exaggerated health claims
- Misrepresentation of breed, age, or lineage
- Listing animals you do not own or have authority to sell
- Listing animals that are deceased, ill, or unavailable
- Duplicate listings for the same animal
- Keyword stuffing or irrelevant tags to manipulate search results

================================================================================

3. MESSAGING STANDARDS

3.1 Permitted Use
The messaging system is provided for legitimate communication between
breeders and pet seekers regarding listed animals.

3.2 Prohibited Messaging
The following will result in immediate permanent account ban:
- Abusive, threatening, harassing, or hateful messages
- Spam or unsolicited commercial messages
- Sharing personal contact information to circumvent the platform
- Attempting to conduct transactions outside the platform to avoid fees
- Phishing, scam attempts, or fraudulent communications
- Messages containing links to malware or harmful content

================================================================================

4. HEALTH AND WELFARE REPRESENTATIONS

Breeders must not:
- Claim an animal is vaccinated, microchipped, or health-certified without
  valid documentation
- Misrepresent the health history or genetic background of an animal
- List animals that are known to be ill without disclosing their condition
- Represent animals as purebred without appropriate documentation

Breedly reserves the right to remove listings that appear to misrepresent
animal health or welfare, and to report suspected animal welfare violations
to appropriate authorities.

================================================================================

5. ACCOUNT AND IDENTITY STANDARDS

- You may only operate one account per person or business entity
- You may not impersonate another breeder, business, or individual
- You may not use automated tools, bots, or scripts to interact with the platform
- You may not create accounts for the purpose of leaving false reviews or
  manipulating platform metrics

================================================================================

6. ENFORCEMENT

Breedly reserves the right to:
- Remove any content that violates this AUP without prior notice
- Suspend or permanently ban accounts for violations
- Report illegal content or conduct to law enforcement
- Take legal action to recover damages caused by violations

Enforcement decisions are at Breedly's sole discretion. Banned accounts
may not create new accounts to circumvent a ban.

================================================================================

7. REPORTING VIOLATIONS

To report a violation of this AUP:
Email:   abuse@breedly.us
Phone:   (240) 242-9483

We review all reports and take appropriate action, though we cannot guarantee
a response to every report.

================================================================================

8. CONTACT US

Email:   legal@breedly.us
Phone:   (240) 242-9483
Website: https://breedly.us
State:   Maryland, United States

================================================================================

© 2026 Breedly. All rights reserved.
`;
  }
}
