import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface NotificationItem { id: number; title: string; body?: string; time: string; read?: boolean }

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  notifications: NotificationItem[] = [
    { id: 1, title: 'Alice đã thích bài viết của bạn', time: '2 giờ trước' },
    { id: 2, title: 'Bob trả lời bình luận của bạn', time: '1 ngày trước' },
    { id: 3, title: 'Hệ thống: Cập nhật điều khoản', time: '3 ngày trước' }
  ];

  markAllRead() {
    this.notifications = this.notifications.map(n => ({ ...n, read: true }));
  }

  remove(id: number) {
    this.notifications = this.notifications.filter(n => n.id !== id);
  }
}

export default NotificationsComponent;
