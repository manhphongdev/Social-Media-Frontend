import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  menuOpen = false;

  // Số lượng thông báo chưa đọc (mock data)
  unreadNotificationCount = 5;

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  // Method để clear notification count khi user click vào notifications
  clearNotificationBadge() {
    this.unreadNotificationCount = 0;
  }
}
