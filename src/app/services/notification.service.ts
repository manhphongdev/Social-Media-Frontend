import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, BehaviorSubject, of} from 'rxjs';
import {tap, map, catchError, timeout} from 'rxjs/operators';
import {
  Notification,
  NotificationResponse,
  ApiResponse,
  UnreadCountResponse
} from '../models/notification.model';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:8888/notifications';

  // BehaviorSubject to track unread count
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private http: HttpClient) {
    // Don't auto-load on service creation - let components decide when to load
  }

  /**
   * Get current unread count value
   */
  public get unreadCountValue(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Get all notifications with pagination
   * @param limit Number of notifications to fetch
   * @param cursor Cursor for pagination (optional)
   */
  getNotifications(limit: number = 20, cursor?: string): Observable<NotificationResponse> {
    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http.get<ApiResponse<NotificationResponse>>(
      `${this.apiUrl}`,
      {params}
    ).pipe(
      timeout(10000), // 10 second timeout
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching notifications:', error);
        // Return empty response on error
        return of({content: [], nextCursor: null, hasNext: false});
      })
    );
  }


  /**
   * Get unread notifications with pagination
   * @param limit Number of notifications to fetch
   * @param cursor Cursor for pagination (optional)
   */
  getUnreadNotifications(limit: number = 20, cursor?: string): Observable<NotificationResponse> {
    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http.get<ApiResponse<NotificationResponse>>(
      `${this.apiUrl}/unread`,
      {params}
    ).pipe(
      timeout(10000),
      map(response => response.data),
      catchError(error => {
        console.error('Error fetching unread notifications:', error);
        return of({content: [], nextCursor: null, hasNext: false});
      })
    );
  }

  /**
   * Get count of unread notifications
   */
  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<number>>(
      `${this.apiUrl}/unread-count`
    ).pipe(
      timeout(10000),
      map(response => response.data),
      tap(count => this.unreadCountSubject.next(count)),
      catchError(error => {
        console.error('Error fetching unread count:', error);
        return of(0);
      })
    );
  }

  /**
   * Mark a notification as read
   * @param notificationId ID of the notification to mark as read
   */
  markAsRead(notificationId: number): Observable<void> {
    return this.http.put<void>(
      `${this.apiUrl}/mark-read`,
      {},
      {params: {id: notificationId.toString()}}
    ).pipe(
      timeout(10000),
      tap(() => {
        // Decrement unread count
        const currentCount = this.unreadCountSubject.value;
        if (currentCount > 0) {
          this.unreadCountSubject.next(currentCount - 1);
        }
      }),
      catchError(error => {
        console.error('Error marking notification as read:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Mark all notifications as read
   * TODO: Implement mark all as read API in backend first
   */
  markAllAsRead(): Observable<void> {
    console.warn('markAllAsRead API not implemented in backend yet');
    return of(void 0);
  }

  /**
   * Delete a notification
   * @param notificationId ID of the notification to delete
   */
  deleteNotification(notificationId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${notificationId}`
    ).pipe(
      timeout(10000),
      catchError(error => {
        console.error('Error deleting notification:', error);
        return of(void 0);
      })
    );
  }

  /**
   * Load unread count (called when user logs in or when needed)
   */
  loadUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (count) => {
        console.log('Loaded unread count:', count);
      },
      error: (error) => {
        console.error('Failed to load unread notification count:', error);
      }
    });
  }

  /**
   * Refresh unread count manually
   */
  refreshUnreadCount(): Observable<number> {
    return this.getUnreadCount();
  }
}
