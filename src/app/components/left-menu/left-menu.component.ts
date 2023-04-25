import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css'],
})
export class LeftMenuComponent implements OnInit {
  location: any;
  route: any;
  constructor(private router: Router, private loc: Location) {}

  ngOnInit(): void {
    this.router.events.subscribe((res) => {
      this.route = this.loc.path();
    });
  }
}
