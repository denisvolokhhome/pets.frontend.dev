import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    // return next.handle(request);
    const idToken = localStorage.getItem('id_token');

    if (idToken) {
      const cloned = request.clone({
        headers: request.headers.set('Authorization', 'Bearer ' + idToken),
      });

      return next.handle(cloned);
    } else {
      return next.handle(request);
      // .pipe(
      //   tap(
      //     () => {},
      //     (err: any) => {
      //       if (err instanceof HttpErrorResponse) {
      //         if (err.status !== 401) {
      //           return;
      //         }
      //         this.router.navigate(['login']);
      //       }
      //     }
      //   )
      // );
    }
  }
}
