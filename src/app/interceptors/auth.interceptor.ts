import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpInterceptor,
    HttpHandler,
    HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';

/**
 * HTTP Interceptor to automatically add Authorization Bearer token to all requests
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        // Get accessToken from localStorage
        const accessToken = localStorage.getItem('accessToken');

        // Debug logging
        console.log('🔐 AuthInterceptor:', {
            url: req.url,
            hasToken: !!accessToken,
            tokenPreview: accessToken ? accessToken.substring(0, 20) + '...' : 'NO TOKEN'
        });

        // Clone request and add Authorization header if token exists
        if (accessToken) {
            const authReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${accessToken}`)
            });
            console.log('✅ Added Authorization header to request');
            return next.handle(authReq);
        }

        // If no token, proceed with original request
        console.log('⚠️ No token found, proceeding without Authorization header');
        return next.handle(req);
    }
}
