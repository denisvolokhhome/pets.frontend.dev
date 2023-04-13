import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.css'],
})
export class LogoutComponent {
  constructor(private service: AuthService, private router: Router) {
    localStorage.clear();
    this.service.LogoutUser(); //specify user to logout!!! pass the token!!!
    this.router.navigate(['login']);
  }
}
