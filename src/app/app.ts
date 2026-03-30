import {Component, OnInit, signal} from '@angular/core';
import {WebSocketService} from './services/websocket.service';
import {AuthService} from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  protected readonly title = signal('Frontend');

  constructor(
    private wsService: WebSocketService,
    private authService: AuthService
  ) {
  }

  ngOnInit() {
    const token = this.authService.getToken();
    if (token) {
      console.log('🔌 Attempting to connect WebSocket...');
      try {
        this.wsService.connect(token);
      } catch (error) {
        console.error('❌ Failed to connect WebSocket:', error);
      }
    } else {
      console.log('ℹ️ No token found, skipping WebSocket connection');
    }
  }
}
