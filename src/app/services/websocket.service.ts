import {Injectable} from '@angular/core';
import {Client} from '@stomp/stompjs';
import {BehaviorSubject} from 'rxjs';
import SockJS from 'sockjs-client';

@Injectable({providedIn: 'root'})
export class WebSocketService {

  private client?: Client;
  private connected$ = new BehaviorSubject<boolean>(false);

  connect(token: string) {
    if (this.client?.active) {
      console.log('⚠️ WebSocket already connected');
      return;
    }

    try {
      this.client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8888/ws'),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
      });

      this.client.onConnect = () => {
        console.log('✅ STOMP connected');
        this.connected$.next(true);
      };

      this.client.onWebSocketClose = () => {
        console.warn('🔌 WebSocket closed');
        this.connected$.next(false);
      };

      this.client.onStompError = (frame) => {
        console.error('❌ Broker error', frame.headers['message']);
      };

      this.client.activate();
    } catch (error) {
      console.error('❌ Failed to initialize WebSocket client:', error);
      this.connected$.next(false);
    }
  }

  disconnect() {
    this.client?.deactivate();
    this.connected$.next(false);
  }

  subscribe(topic: string, callback: (msg: any) => void) {
    if (!this.client?.connected) return;

    return this.client.subscribe(topic, msg =>
      callback(JSON.parse(msg.body))
    );
  }

  send(destination: string, body: any) {
    if (!this.client?.connected) return;

    this.client.publish({
      destination,
      body: JSON.stringify(body)
    });
  }

  isConnected() {
    return this.connected$.asObservable();
  }
}
