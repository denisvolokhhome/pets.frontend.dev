import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ToastService } from './toast.service';
import { environment } from 'src/environments/environment';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private toastService: ToastService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const idToken = localStorage.getItem('id_token');

    // Only ever send the token to our own API.
    if (idToken && request.url.startsWith(environment.API_HOST)) {
      const cloned = request.clone({
        headers: request.headers.set('Authorization', 'Bearer ' + idToken),
      });

      return next.handle(cloned).pipe(
        catchError((error: HttpErrorResponse) => {
          // Token expired or invalid. Concurrent requests can all fail at once;
          // only the first one (token still present) signs the user out.
          if (error.status === 401 && localStorage.getItem('id_token')) {
            // Toast after navigation so the layout swap doesn't drop it
            this.authService.handleSessionExpired().then(() =>
              this.toastService.warning('Please sign in again.', 'Session expired')
            );
          }
          return throwError(() => error);
        })
      );
    } else {
      return next.handle(request);
    }
  }
}
