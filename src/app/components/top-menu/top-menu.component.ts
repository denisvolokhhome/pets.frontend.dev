import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.css'],
})
export class TopMenuComponent {
  constructor(private service: AuthService) {}

  get userLoggedIn() {
    return this.service.IsLoggedIn();
  }
}
