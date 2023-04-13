import { Component } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { map, switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.css'],
})
export class TopMenuComponent {
  constructor(private service: AuthService) {}

  get userLoggedIn(): Boolean {
    return true;
  }
}
