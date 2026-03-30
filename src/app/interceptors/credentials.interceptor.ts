import {Injectable} from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest
} from '@angular/common/http';
import {Observable} from 'rxjs';

/**
 * HTTP Interceptor to automatically include credentials (cookies) in all requests
 * This is required for the backend to set and read refreshToken cookies
 */
@Injectable()
export class CredentialsInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Clone the request and add withCredentials: true
    const credentialReq = req.clone({
      withCredentials: true
    });

    return next.handle(credentialReq);
  }
}
