import { Location } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  standalone: false,
  selector: 'app-left-menu',
  templateUrl: './left-menu.component.html',
  styleUrls: ['./left-menu.component.css'],
})
export class LeftMenuComponent implements OnInit {
  location: any;
  route: any;
  isCollapsed: boolean = false;
  
  constructor(
    private router: Router, 
    private loc: Location,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load collapsed state from localStorage
    const savedState = localStorage.getItem('leftMenuCollapsed');
    this.isCollapsed = savedState === 'true';
    
    this.router.events.subscribe((res) => {
      this.route = this.loc.path();
      this.cdr.detectChanges();
    });
  }
  
  toggleMenu(): void {
    this.isCollapsed = !this.isCollapsed;
    // Save state to localStorage
    localStorage.setItem('leftMenuCollapsed', this.isCollapsed.toString());
  }
}
