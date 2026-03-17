import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * Adds security-related headers to auth API requests:
 * - X-Requested-With: XMLHttpRequest — allows backend to reject non-AJAX requests (CSRF mitigation).
 * - Accept: application/json — explicit content negotiation.
 * Backend can optionally require X-Requested-With on state-changing /auth/* routes.
 */
@Injectable()
export class AuthHttpInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const isAuthRequest = req.url.includes('/auth/');
    if (!isAuthRequest) {
      return next.handle(req);
    }
    const cloned = req.clone({
      setHeaders: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(req.headers.has('Accept') ? {} : { Accept: 'application/json' }),
      },
    });
    return next.handle(cloned);
  }
}
