import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

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
  private userSubscription?: Subscription;

  // Số lượng thông báo chưa đọc (mock data)
  unreadNotificationCount = 5;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Subscribe to auth state changes
    this.userSubscription = this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      this.isLoggedIn = !!user && this.authService.isLoggedIn();
    });
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  // Method để clear notification count khi user click vào notifications
  clearNotificationBadge() {
    this.unreadNotificationCount = 0;
  }

  logout() {
    this.authService.logout();
    this.profileMenuOpen = false;
    this.router.navigateByUrl('/login');
  }
}
