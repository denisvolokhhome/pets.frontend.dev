import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from '../services/toast.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class BreederGuard {
  constructor(
    private authService: AuthService,
    private router: Router,
    private toastr: ToastService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree>
    | boolean
    | UrlTree {
    return this.authService.IsLoggedIn().pipe(
      map((user) => {
        // First check if user is logged in
        if (!user) {
          this.toastr.error('Please log in to access this page', 'Authentication Required');
          this.router.navigate(['login']);
          return false;
        }

        // Check if user is a breeder
        if (!user.is_breeder) {
          this.toastr.error('This page is only accessible to breeders', 'Access Denied');
          this.router.navigate(['dashboard']);
          return false;
        }

        return true;
      })
    );
  }
}
