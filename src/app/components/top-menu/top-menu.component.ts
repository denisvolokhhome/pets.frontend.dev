import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-top-menu',
  templateUrl: './top-menu.component.html',
  styleUrls: ['./top-menu.component.css'],
})
export class TopMenuComponent implements OnInit {
  location: any;
  route: any;
  constructor(
    private service: AuthService,
    private router: Router,
    private loc: Location
  ) {}

  ngOnInit(): void {
    this.router.events.subscribe((res) => {
      this.route = this.loc.path();
    });
  }

  get checkToken() {
    if (localStorage.getItem('id_token')) {
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy() {}
}
