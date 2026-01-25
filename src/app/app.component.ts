import { Location } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  title = 'pets.frontend.dev';
  location: any;
  logoURL: any;
  route: any;

  constructor(private router: Router, private loc: Location) {}

  ngOnInit(): void {
    this.router.events.subscribe((res) => {
      // Get the path without query parameters
      const fullPath = this.loc.path();
      this.route = fullPath.split('?')[0]; // Remove query parameters
    });
  }
}
