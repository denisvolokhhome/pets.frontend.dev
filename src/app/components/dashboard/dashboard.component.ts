import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { ModalService } from 'src/app/services/modal.service';

@Component({
  standalone: false,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  
  constructor(
    public authService: AuthService,
    private modalService: ModalService
  ) {}

  ngOnInit(): void {
    // Load user data if not already loaded
    if (!this.authService.currentUser) {
      this.authService.IsLoggedIn().subscribe();
    }
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
