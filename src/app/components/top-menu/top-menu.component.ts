import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.css'],
})
export class TopMenuComponent implements OnInit {
  constructor(private service: AuthService) {}

  ngOnInit(): void {}

  get checkToken() {
    if (localStorage.getItem('id_token')) {
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy() {}
}
