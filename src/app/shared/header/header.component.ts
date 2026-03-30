import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth.service';
import {NotificationService} from '../../services/notification.service';
import {WebSocketService} from '../../services/websocket.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {User} from '../../models/user.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {
  menuOpen = false;
  profileMenuOpen = false;

  // Authentication state
  isLoggedIn = false;
  currentUser: User | null = null;
  // Unread notification count (from service)
  unreadNotificationCount = 0;
  private userSubscription?: Subscription;
  private notificationSubscription?: Subscription;
  private websocketSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private websocketService: WebSocketService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    // Subscribe to auth state changes
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user && this.authService.isLoggedIn();

      // Load notification count when user logs in
      if (this.isLoggedIn) {
        this.subscribeToNotificationCount();
        this.connectWebSocket();
      } else {
        // Reset count when logged out
        this.unreadNotificationCount = 0;
        this.websocketService.disconnect();
      }
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
    this.notificationSubscription?.unsubscribe();
    this.websocketSubscription?.unsubscribe();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  /**
   * Clear notification badge when user navigates to notifications page
   * The actual count will be updated by the notification service
   */
  clearNotificationBadge() {
    // Optionally refresh the count when navigating to notifications
    this.notificationService.refreshUnreadCount().subscribe();
  }

  logout() {
    this.authService.logout();
    this.websocketService.disconnect();
    this.profileMenuOpen = false;
    this.router.navigateByUrl('/login');
  }

  /**
   * Subscribe to notification count updates
   */
  private subscribeToNotificationCount(): void {
    // Unsubscribe from previous subscription if exists
    this.notificationSubscription?.unsubscribe();

    // Subscribe to unread count changes
    this.notificationSubscription = this.notificationService.unreadCount$.subscribe(
      count => {
        this.unreadNotificationCount = count;
      }
    );

    // Initial load of unread count
    this.notificationService.loadUnreadCount();
  }

  /**
   * Connect and subscribe to WebSocket notifications
   */
  private connectWebSocket(): void {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    this.websocketService.connect(token);

    // Subscribe to connection status
    this.websocketSubscription = this.websocketService.isConnected().subscribe(connected => {
      if (connected) {
        console.log('🔗 WebSocket connected, subscribing to notifications...');

        // Subscribe to user specific notifications queue
        // Backend NotificationServiceImpl sends to "/user/queue/notifications"
        this.websocketService.subscribe('/user/queue/notifications', (notification: any) => {
          console.log('🔔 New notification received:', notification);

          // Show toast
          this.showNotificationToast(notification);

          // Refresh unread count
          this.notificationService.refreshUnreadCount().subscribe();
        });
      }
    });
  }

  private showNotificationToast(notification: any): void {
    const message = notification.text || 'Bạn có thông báo mới';

    this.snackBar.open(message, 'Xem', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
      panelClass: ['notification-toast']
    }).onAction().subscribe(() => {
      this.router.navigate(['/notifications']);
    });
  }
}
