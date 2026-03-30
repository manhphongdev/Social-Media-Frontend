import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable, BehaviorSubject} from 'rxjs';
import {tap} from 'rxjs/operators';
import {
  User,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse
} from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8888/auth';
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /**
   * Get current user value
   */
  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  /**
   * Register a new user
   */
  register(request: RegisterRequest): Observable<RegisterResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': '*/*'
    });

    return this.http.post<RegisterResponse>(
      `${this.apiUrl}/register`,
      request,
      {
        headers,
        withCredentials: true  // Enable cookies/credentials
      }
    ).pipe(
      tap(response => {
        // Store user and accessToken if registration is successful
        if (response.data) {
          // Store accessToken
          localStorage.setItem('accessToken', response.data.accessToken);

          // Store user if available, otherwise store email from request
          if (response.data.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
          } else {
            // Store minimal user info from request
            const user: User = {
              id: 0,
              name: request.name,
              email: request.email
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        }
      })
    );
  }

  /**
   * Login user
   */
  login(request: LoginRequest): Observable<LoginResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'accept': '*/*'
    });

    return this.http.post<LoginResponse>(
      `${this.apiUrl}/login`,
      request,
      {
        headers,
        withCredentials: true  // Enable cookies/credentials
      }
    ).pipe(
      tap(response => {
        // Store user and accessToken if login is successful
        if (response.data) {
          // Store accessToken
          localStorage.setItem('accessToken', response.data.accessToken);

          // Store user if available, otherwise store username from request
          if (response.data.user) {
            localStorage.setItem('currentUser', JSON.stringify(response.data.user));
            this.currentUserSubject.next(response.data.user);
          } else {
            // Store minimal user info from request
            const user: User = {
              id: 0,
              name: request.username,
              email: undefined
            };
            localStorage.setItem('currentUser', JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        }
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    this.currentUserSubject.next(null);
  }

  /**
   * Get stored token (accessToken)
   */
  getToken(): string | null {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  }

  /**
   * Check if user is logged in
   */
  isLoggedIn(): boolean {
    return !!this.getToken() && !!this.currentUserValue;
  }
}
