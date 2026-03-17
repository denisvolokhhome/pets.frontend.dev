import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';
import { DataService } from 'src/app/services/data.service';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  totalPets: number = 0;
  activeBreedings: number = 0;
  unreadMessages: number = 0;
  isLoading: boolean = true;
  showWelcomeModal: boolean = false;
  
  constructor(
    public authService: AuthService,
    private modalService: ModalService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Load user data if not already loaded
    if (!this.authService.currentUser) {
      this.authService.IsLoggedIn().subscribe({
        next: () => {
          this.loadDashboardData();
          this.checkWelcomeModal();
        }
      });
    } else {
      this.loadDashboardData();
      this.checkWelcomeModal();
    }
  }

  checkWelcomeModal(): void {
    if (this.authService.isBreeder && localStorage.getItem('breeder_just_registered') === 'true') {
      localStorage.removeItem('breeder_just_registered');
      this.showWelcomeModal = true;
      this.cdr.detectChanges();
    }
  }

  closeWelcomeModal(): void {
    this.showWelcomeModal = false;
    this.cdr.detectChanges();
  }

  goToBreederProfile(): void {
    this.showWelcomeModal = false;
    this.router.navigate(['/settings/breedery']);
  }

  goToLocations(): void {
    this.showWelcomeModal = false;
    this.router.navigate(['/settings/locations']);
  }

  loadDashboardData(): void {
    if (!this.authService.currentUser?.id) {
      console.log('No user ID available');
      return;
    }

    const userId = this.authService.currentUser.id;
    console.log('Loading dashboard data for user:', userId);

    // Load pets count - filter out puppies (is_puppy = 1 or true)
    this.dataService.getPetsByBreeder(userId).subscribe({
      next: (pets) => {
        console.log('Pets loaded:', pets);
        // Filter to only show adult pets (not puppies)
        const adultPets = pets.filter(p => !p.is_puppy || p.is_puppy === 0);
        this.totalPets = adultPets.length;
        console.log('Adult pets count:', this.totalPets);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading pets:', error);
        this.totalPets = 0;
        this.cdr.detectChanges();
      }
    });

    // Load breedings count - filter by status (InProcess = active)
    this.dataService.getBreedings().subscribe({
      next: (breedings) => {
        console.log('Breedings loaded:', breedings);
        // Count breedings with status 'InProcess' as active
        this.activeBreedings = breedings.filter(b => b.status === 'InProcess').length;
        console.log('Active breedings count:', this.activeBreedings);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading breedings:', error);
        this.activeBreedings = 0;
        this.cdr.detectChanges();
      }
    });

    // For now, set messages to 0 until we implement the messages API
    this.unreadMessages = 0;
    this.isLoading = false;
    this.cdr.detectChanges();
  }

  get isBreeder(): boolean {
    return this.authService.isBreeder;
  }

  get isPetSeeker(): boolean {
    return this.authService.isPetSeeker;
  }

  get currentUser() {
    return this.authService.currentUser;
  }

  openAddPetModal(): void {
    this.modalService.open('addPetModal');
  }
}
