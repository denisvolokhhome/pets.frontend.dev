import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

type Role = 'petSeeker' | 'breeder' | 'serviceProvider';

interface RoleOption {
  id: Role;
  icon: string;
  title: string;
  description: string;
  registerType: string;
  cta: string;
}

interface Step {
  title: string;
  description: string;
}

interface SamplePet {
  name: string;
  price: string;
  meta: string;
  image: string;
  status: 'Available' | 'Reserved';
  chips: string[];
  kennel: string;
}

/**
 * Preview of the new visual direction (warm "oat / clay / pine" palette,
 * Literata + Onest). Lives at /home-next and does not replace HomeComponent.
 */
@Component({
  selector: 'app-home-next',
  standalone: false,
  templateUrl: './home-next.component.html',
  styleUrls: ['./home-next.component.css']
})
export class HomeNextComponent {
  readonly serviceProvidersEnabled = environment.enableServiceProviders;
  readonly billingEnabled = environment.enableBilling;
  readonly img = 'assets/new-design/';

  readonly roles: RoleOption[] = ([
    {
      id: 'petSeeker',
      icon: 'bi-search-heart',
      title: "I'm looking for a puppy or kitten",
      description: 'Search the map, save favorites, message breeders',
      registerType: 'pet_seeker',
      cta: 'Continue as pet seeker'
    },
    {
      id: 'breeder',
      icon: 'bi-house-heart',
      title: "I'm a breeder",
      description: 'Kennel profile, litters, health records and documents',
      registerType: 'breeder',
      cta: 'Continue as breeder'
    },
    {
      id: 'serviceProvider',
      icon: 'bi-shop',
      title: 'I run a pet business',
      description: 'Grooming, walking, sitting, training — listed by location',
      registerType: 'service',
      cta: 'Continue as service provider'
    }
  ] as RoleOption[]).filter(r => r.id !== 'serviceProvider' || this.serviceProvidersEnabled);

  selectedRole: Role = 'petSeeker';

  readonly steps: Record<Role, Step[]> = {
    petSeeker: [
      { title: 'Browse', description: 'Search the map for available pets from breeders near you.' },
      { title: 'Check', description: 'See health records, documents and reviews before you reach out.' },
      { title: 'Talk', description: 'Message the breeder about a specific puppy or kitten.' },
      { title: 'Bring home', description: 'Arrange a visit and welcome your new family member.' }
    ],
    breeder: [
      { title: 'Register', description: 'Create your breeder account in a couple of minutes.' },
      { title: 'Build your profile', description: 'Add photos, parents, certifications and your program.' },
      { title: 'List litters', description: 'Publish offspring with health records and documents.' },
      { title: 'Find families', description: 'Answer messages and choose the right homes.' }
    ],
    serviceProvider: [
      { title: 'Register', description: 'Pick the categories that describe your services.' },
      { title: 'Set up profile', description: 'Business name, photo and contact details.' },
      { title: 'Add locations', description: 'Each one is geocoded so owners nearby find you.' },
      { title: 'List services', description: 'Pricing and descriptions for every service you offer.' }
    ]
  };

  readonly samplePets: SamplePet[] = [
    { name: 'Maple', price: '$2,800', meta: 'Golden Retriever · Female · 6 wks', image: 'pet-golden.webp', status: 'Available', chips: ['Vet checked', 'Microchipped'], kennel: 'Sunny Creek Goldens · TX' },
    { name: 'Bramble', price: '$1,900', meta: 'Maine Coon · Male · 12 wks', image: 'pet-mainecoon.webp', status: 'Available', chips: ['TICA registered', 'Vaccinated'], kennel: 'Hill Country Coons · TX' },
    { name: 'Biscuit', price: '$3,600', meta: 'French Bulldog · Male · 10 wks', image: 'pet-frenchie.webp', status: 'Reserved', chips: ['BOAS graded', 'DNA tested'], kennel: 'Lone Star Frenchies · TX' },
    { name: 'Pebble', price: '$1,700', meta: 'British Shorthair · Female · 11 wks', image: 'pet-british.webp', status: 'Available', chips: ['Vet checked', 'Litter trained'], kennel: 'Bluebonnet Brits · TX' }
  ];

  saved = new Set<string>();

  constructor(private router: Router) {}

  get currentRole(): RoleOption {
    return this.roles.find(r => r.id === this.selectedRole) ?? this.roles[0];
  }

  get currentSteps(): Step[] {
    return this.steps[this.selectedRole];
  }

  selectRole(role: Role): void {
    this.selectedRole = role;
  }

  toggleSaved(name: string): void {
    if (this.saved.has(name)) {
      this.saved.delete(name);
    } else {
      this.saved.add(name);
    }
  }

  continueWithRole(): void {
    this.router.navigate(['/register'], { queryParams: { type: this.currentRole.registerType } });
  }

  register(type: 'breeder' | 'pet_seeker'): void {
    this.router.navigate(['/register'], { queryParams: { type } });
  }

  findPet(): void {
    this.router.navigate(['/search-pets']);
  }
}
