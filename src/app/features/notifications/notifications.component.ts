import {Component, OnInit, OnDestroy, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {NotificationService} from '../../services/notification.service';
import {Notification, NotificationType, TargetType} from '../../models/notification.model';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = false;
  error: string | null = null;
  hasNext = false;
  nextCursor: string | null = null;

  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.loadNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load notifications from the API
   */
  loadNotifications(cursor?: string): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges(); // Trigger change detection for loading state

    const sub = this.notificationService.getNotifications(20, cursor).subscribe({
      next: (response) => {
        console.log('Notifications response:', response);

        if (cursor) {
          // Append to existing notifications (pagination)
          this.notifications = [...this.notifications, ...response.content];
        } else {
          // Replace notifications (initial load)
          this.notifications = response.content;
        }

        this.hasNext = response.hasNext;
        this.nextCursor = response.nextCursor;
        this.loading = false;

        // Log for debugging
        console.log(`Loaded ${response.content.length} notifications`);
        this.cdr.detectChanges(); // Trigger change detection after data load
      },
      error: (error) => {
        console.error('Failed to load notifications:', error);
        this.error = 'Không thể tải thông báo. Vui lòng thử lại sau.';
        this.loading = false;
        this.cdr.detectChanges(); // Trigger change detection on error
      },
      complete: () => {
        // Ensure loading is always set to false
        this.loading = false;
        this.cdr.detectChanges(); // Trigger change detection on complete
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Load more notifications (pagination)
   */
  loadMore(): void {
    if (this.hasNext && this.nextCursor && !this.loading) {
      this.loadNotifications(this.nextCursor);
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllRead(): void {
    const sub = this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Update local state
        this.notifications = this.notifications.map(n => ({...n, isRead: true}));
      },
      error: (error) => {
        console.error('Failed to mark all as read:', error);
        this.error = 'Không thể đánh dấu đã đọc. Vui lòng thử lại.';
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Mark a single notification as read
   */
  markAsRead(notification: Notification): void {
    if (notification.isRead) {
      return; // Already read
    }

    const sub = this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        // Update local state
        const index = this.notifications.findIndex(n => n.id === notification.id);
        if (index !== -1) {
          this.notifications[index] = {...notification, isRead: true};
        }
      },
      error: (error) => {
        console.error('Failed to mark notification as read:', error);
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Remove/delete a notification
   */
  remove(id: number): void {
    const sub = this.notificationService.deleteNotification(id).subscribe({
      next: () => {
        // Remove from local state
        this.notifications = this.notifications.filter(n => n.id !== id);
      },
      error: (error) => {
        console.error('Failed to delete notification:', error);
        this.error = 'Không thể xóa thông báo. Vui lòng thử lại.';
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Handle notification click - navigate to target and mark as read
   */
  onNotificationClick(notification: Notification): void {
    // Mark as read
    this.markAsRead(notification);

    // Navigate to target
    this.navigateToTarget(notification);
  }

  /**
   * Navigate to the notification target
   */
  private navigateToTarget(notification: Notification): void {
    switch (notification.targetType) {
      case TargetType.POST:
        this.router.navigate(['/posts', notification.targetId]);
        break;
      case TargetType.COMMENT:
        // Navigate to post with comment highlighted
        this.router.navigate(['/posts', notification.targetId], {
          fragment: `comment-${notification.targetId}`
        });
        break;
      case TargetType.USER:
        this.router.navigate(['/profile', notification.targetId]);
        break;
      default:
        console.warn('Unknown target type:', notification.targetType);
    }
  }

  /**
   * Get display text for notification
   */
  getNotificationText(notification: Notification): string {
    if (notification.text) {
      return notification.text;
    }

    // Fallback text generation based on type
    const userName = notification.fromUser?.name || 'Người dùng';

    switch (notification.type) {
      case NotificationType.REACTION:
        return `${userName} đã thích bài viết của bạn`;
      case NotificationType.COMMENT:
        return `${userName} đã bình luận về bài viết của bạn`;
      case NotificationType.FOLLOW:
        return `${userName} đã theo dõi bạn`;
      case NotificationType.MENTION:
        return `${userName} đã nhắc đến bạn`;
      case NotificationType.SYSTEM:
        return 'Thông báo hệ thống';
      default:
        return 'Thông báo mới';
    }
  }

  /**
   * Get relative time display
   */
  getTimeDisplay(createdAt: string | null): string {
    if (!createdAt) {
      return 'Vừa xong';
    }

    const now = new Date();
    const notificationDate = new Date(createdAt);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Vừa xong';
    } else if (diffMins < 60) {
      return `${diffMins} phút trước`;
    } else if (diffHours < 24) {
      return `${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return notificationDate.toLocaleDateString('vi-VN');
    }
  }

  /**
   * Refresh notifications
   */
  refresh(): void {
    this.loadNotifications();
  }
}

export default NotificationsComponent;
