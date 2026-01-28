import { Component } from '@angular/core';
import { Router } from '@angular/router';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Step {
  number: number;
  title: string;
  description: string;
  icon: string;
}

@Component({
  standalone: false,
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  features: Feature[] = [
    {
      icon: 'pets',
      title: 'Manage Your Pets',
      description: 'Easily track and manage your breeding program with comprehensive pet profiles, health records, and lineage information.'
    },
    {
      icon: 'health_and_safety',
      title: 'Health Tracking',
      description: 'Keep detailed health records including vaccinations, microchip information, and veterinary visits all in one place.'
    },
    {
      icon: 'verified_user',
      title: 'Connect Safely',
      description: 'Build trust with verified breeder profiles and secure communication channels to connect with potential pet families.'
    }
  ];

  breederSteps: Step[] = [
    {
      number: 1,
      title: 'Register',
      description: 'Create your breeder account and set up your profile with your breeding program details.',
      icon: 'person_add'
    },
    {
      number: 2,
      title: 'Create Profile',
      description: 'Build your professional breeder profile with photos, certifications, and breeding philosophy.',
      icon: 'badge'
    },
    {
      number: 3,
      title: 'List Pets',
      description: 'Add your available puppies and adult dogs with detailed health records and photos.',
      icon: 'pets'
    },
    {
      number: 4,
      title: 'Connect',
      description: 'Communicate with potential families and find the perfect homes for your pets.',
      icon: 'handshake'
    }
  ];

  petSeekerSteps: Step[] = [
    {
      number: 1,
      title: 'Browse',
      description: 'Explore available pets from verified breeders with detailed profiles and photos.',
      icon: 'search'
    },
    {
      number: 2,
      title: 'Contact',
      description: 'Reach out to breeders directly to learn more about available pets and ask questions.',
      icon: 'mail'
    },
    {
      number: 3,
      title: 'Meet',
      description: 'Arrange visits to meet the pets in person and get to know the breeder.',
      icon: 'groups'
    },
    {
      number: 4,
      title: 'Adopt',
      description: 'Complete the adoption process and welcome your new family member home.',
      icon: 'home'
    }
  ];

  selectedFlow: 'breeder' | 'petSeeker' = 'breeder';

  constructor(private router: Router) {}

  selectFlow(flow: 'breeder' | 'petSeeker'): void {
    this.selectedFlow = flow;
  }

  get currentSteps(): Step[] {
    return this.selectedFlow === 'breeder' ? this.breederSteps : this.petSeekerSteps;
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  navigateToPets(): void {
    this.router.navigate(['/pets']);
  }
}
