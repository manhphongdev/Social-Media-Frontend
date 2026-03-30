import {Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup} from '@angular/forms';
import {Conversation, Message} from '../../models/message.model';
import {AuthService} from '../../services/auth.service';
import {
  ConversationApiResponse,
  ConversationMessageApiResponse,
  MessageService,
  SendMessageApiResponse,
  SendMessageRequest
} from '../../services/message.service';
import {ProfileService} from '../../services/profile.service';
import {WebSocketService} from '../../services/websocket.service';
import {firstValueFrom, Subscription} from 'rxjs';

interface MediaPreview {
  file: File;
  previewUrl: string;
}

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './messages.component.html',
  styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit, OnDestroy {
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messageForm: FormGroup;
  selectedMediaFiles: File[] = [];
  mediaPreviews: MediaPreview[] = [];
  isSending = false;
  isLoadingMessages = false;
  private websocketStatusSubscription?: Subscription;
  private messageQueueSubscription?: { unsubscribe: () => void };
  private pendingAutoSelectConversationId?: number;
  private viewingPingTimer?: ReturnType<typeof setInterval>;
  private readonly visibilityHandler = () => this.onVisibilityChange();

  constructor(
    private fb: FormBuilder,
    private messageService: MessageService,
    private authService: AuthService,
    private profileService: ProfileService,
    private websocketService: WebSocketService,
    private ngZone: NgZone
  ) {
    this.messageForm = this.fb.group({
      content: ['']
    });
  }

  ngOnInit() {
    this.loadConversations();
    this.initRealtimeMessages();
    document.addEventListener('visibilitychange', this.visibilityHandler);
  }

  ngOnDestroy() {
    this.stopViewingConversation();
    document.removeEventListener('visibilitychange', this.visibilityHandler);
    this.clearSelectedMedia();
    this.websocketStatusSubscription?.unsubscribe();
    this.messageQueueSubscription?.unsubscribe();
  }

  private initRealtimeMessages() {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    this.websocketService.connect(token);

    this.websocketStatusSubscription = this.websocketService.isConnected().subscribe((connected) => {
      if (!connected) {
        return;
      }

      this.messageQueueSubscription?.unsubscribe();
      this.messageQueueSubscription = this.websocketService.subscribe('/user/queue/messages', (payload: SendMessageApiResponse) => {
        this.ngZone.run(() => this.handleIncomingMessage(payload));
      });

      if (this.selectedConversation && !document.hidden) {
        this.startViewingConversation(this.selectedConversation.id);
      }
    });
  }

  private handleIncomingMessage(payload: SendMessageApiResponse) {
    const conversationId = Number(payload.conversationId);
    if (!Number.isFinite(conversationId)) {
      console.warn('Skip realtime message: invalid conversationId', payload);
      return;
    }

    const incomingMessage: Message = {
      id: payload.id,
      senderId: String(payload.sender?.id ?? 'unknown'),
      senderName: payload.sender?.displayName ?? 'Unknown',
      content: payload.message ?? '',
      mediaUrl: payload.mediaUrl ?? undefined,
      timestamp: this.parseConversationTime(payload.createdAt),
      isCurrentUser: false
    };

    const targetConversation = this.conversations.find(c => Number(c.id) === conversationId);

    if (!targetConversation) {
      this.pendingAutoSelectConversationId = conversationId;
      this.loadConversations();
      return;
    }

    if (!this.selectedConversation) {
      this.selectConversation(targetConversation);
    }

    targetConversation.lastMessage = incomingMessage.content || (incomingMessage.mediaUrl ? '📎 Tệp đính kèm' : 'Tin nhắn mới');
    targetConversation.lastMessageTime = incomingMessage.timestamp;

    if (this.selectedConversation?.id === conversationId) {
      this.selectedConversation.messages.push(incomingMessage);
    } else {
      targetConversation.unreadCount = (targetConversation.unreadCount || 0) + 1;
    }

    this.conversations = [...this.conversations]
      .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
  }

  loadConversations() {
    const currentUser = this.authService.currentUserValue;

    if (!currentUser?.id) {
      this.profileService.getMyProfile().subscribe({
        next: (profile) => {
          this.authService.updateCurrentUser(profile);
          this.fetchConversations(profile.id);
        },
        error: (error) => {
          console.error('Cannot load conversations: missing current user profile.', error);
          this.conversations = [];
        }
      });
      return;
    }

    this.fetchConversations(currentUser.id);
  }

  private fetchConversations(currentUserId: number) {
    this.messageService.getConversations(currentUserId).subscribe({
      next: (conversationList) => {
        this.conversations = conversationList
          .map(conversation => this.mapConversationToUI(conversation, currentUserId))
          .sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());

        if (this.selectedConversation) {
          const updatedSelection = this.conversations.find(c => c.id === this.selectedConversation?.id) || null;
          this.selectedConversation = updatedSelection;
          if (updatedSelection) {
            this.loadMessagesForConversation(updatedSelection);
          }
        }

        if (!this.selectedConversation && this.pendingAutoSelectConversationId) {
          const pendingConversation = this.conversations.find(c => c.id === this.pendingAutoSelectConversationId) || null;
          if (pendingConversation) {
            this.selectConversation(pendingConversation);
          }
          this.pendingAutoSelectConversationId = undefined;
        }

        if (!this.selectedConversation && this.conversations.length === 1) {
          this.selectConversation(this.conversations[0]);
        }
      },
      error: (error) => {
        console.error('Failed to load conversations', error);
        this.conversations = [];
      }
    });
  }

  private mapConversationToUI(conversation: ConversationApiResponse, currentUserId: number): Conversation {
    const participants = conversation.participants || [];
    const partner = participants.find(participant => participant.id !== currentUserId) || participants[0];
    const lastMessageContent = conversation.lastMessage?.message?.trim();

    return {
      id: conversation.id,
      userId: String(partner?.id ?? conversation.id),
      userName: partner?.displayName || 'Unknown User',
      userAvatar: partner?.avatar ?? undefined,
      lastMessage: lastMessageContent || (conversation.lastMessage?.mediaUrl ? '📎 Tệp đính kèm' : 'Bắt đầu cuộc trò chuyện'),
      lastMessageTime: this.parseConversationTime(conversation.lastMessage?.createdAt || conversation.lastMessageAt),
      unreadCount: 0,
      isOnline: partner?.isOnline ?? false,
      messages: []
    };
  }

  private parseConversationTime(value?: string | null): Date {
    if (!value) {
      return new Date();
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  selectConversation(conversation: Conversation) {
    const previousConversationId = this.selectedConversation?.id;
    if (previousConversationId && previousConversationId !== conversation.id) {
      this.stopViewingConversation(previousConversationId);
    }

    this.selectedConversation = conversation;
    conversation.unreadCount = 0;
    this.startViewingConversation(conversation.id);
    this.loadMessagesForConversation(conversation);
  }

  backToConversationList() {
    this.stopViewingConversation();
    this.selectedConversation = null;
  }

  private startViewingConversation(conversationId: number) {
    this.websocketService.send('/app/chat/view/start', conversationId);
    this.startViewingHeartbeat(conversationId);
  }

  private stopViewingConversation(conversationId?: number) {
    const id = conversationId ?? this.selectedConversation?.id;
    if (id) {
      this.websocketService.send('/app/chat/view/stop', id);
    }
    this.stopViewingHeartbeat();
  }

  private startViewingHeartbeat(conversationId: number) {
    this.stopViewingHeartbeat();
    this.viewingPingTimer = setInterval(() => {
      if (!this.selectedConversation || this.selectedConversation.id !== conversationId || document.hidden) {
        return;
      }
      this.websocketService.send('/app/chat/view/ping', conversationId);
    }, 25000);
  }

  private stopViewingHeartbeat() {
    if (this.viewingPingTimer) {
      clearInterval(this.viewingPingTimer);
      this.viewingPingTimer = undefined;
    }
  }

  private onVisibilityChange() {
    if (!this.selectedConversation) {
      return;
    }

    if (document.hidden) {
      this.stopViewingConversation(this.selectedConversation.id);
      return;
    }

    this.startViewingConversation(this.selectedConversation.id);
  }

  private loadMessagesForConversation(conversation: Conversation) {
    this.isLoadingMessages = true;
    const currentUserId = this.authService.currentUserValue?.id;

    this.messageService.getMessages(conversation.id).subscribe({
      next: (messages) => {
        conversation.messages = this.mapMessagesToUI(messages, currentUserId);
        this.isLoadingMessages = false;
      },
      error: (error) => {
        console.error('Failed to load conversation messages', error);
        conversation.messages = [];
        this.isLoadingMessages = false;
      }
    });
  }

  private mapMessagesToUI(messages: ConversationMessageApiResponse[], currentUserId?: number): Message[] {
    return messages
      .map((message) => ({
        id: message.id,
        senderId: String(message.sender?.id ?? 'unknown'),
        senderName: message.sender?.displayName ?? 'Unknown',
        content: message.message ?? '',
        mediaUrl: message.mediaUrl ?? undefined,
        timestamp: this.parseConversationTime(message.createdAt),
        isCurrentUser: !!currentUserId && message.sender?.id === currentUserId
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  onMediaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const incomingFiles = Array.from(input.files);

    incomingFiles.forEach((file) => {
      const alreadySelected = this.selectedMediaFiles.some(
        existing => existing.name === file.name
          && existing.size === file.size
          && existing.lastModified === file.lastModified
      );

      if (!alreadySelected) {
        const previewUrl = URL.createObjectURL(file);
        this.selectedMediaFiles.push(file);
        this.mediaPreviews.push({file, previewUrl});
      }
    });

    input.value = '';
  }

  removeMedia(index: number) {
    const media = this.mediaPreviews[index];
    if (media) {
      URL.revokeObjectURL(media.previewUrl);
    }

    this.mediaPreviews.splice(index, 1);
    this.selectedMediaFiles.splice(index, 1);
  }

  clearSelectedMedia() {
    this.mediaPreviews.forEach(media => URL.revokeObjectURL(media.previewUrl));
    this.mediaPreviews = [];
    this.selectedMediaFiles = [];
  }

  canSendMessage(): boolean {
    if (!this.selectedConversation || this.isSending) {
      return false;
    }

    const content = (this.messageForm.value.content || '').trim();
    return !!content || this.selectedMediaFiles.length > 0;
  }

  async sendMessage() {
    if (!this.selectedConversation || this.isSending) return;

    const content = (this.messageForm.value.content || '').trim();
    if (!content && this.selectedMediaFiles.length === 0) return;

    this.isSending = true;

    const recipientIdCandidate = Number(this.selectedConversation.userId);
    const recipientId = Number.isFinite(recipientIdCandidate)
      ? recipientIdCandidate
      : this.selectedConversation.id;

    if (!Number.isFinite(recipientId)) {
      alert('Không thể xác định người nhận.');
      this.isSending = false;
      return;
    }

    const request: SendMessageRequest = {
      recipientId,
      message: content || ''
    };

    try {
      const uploadedMediaUrls: string[] = [];

      for (const file of this.selectedMediaFiles) {
        const presignedData = await firstValueFrom(this.messageService.generateUploadUrl(file));
        await firstValueFrom(this.messageService.uploadFileToPresignedUrl(file, presignedData));
        uploadedMediaUrls.push(presignedData.fileUrl);
      }

      const outgoingRequests: SendMessageRequest[] = [];
      if (uploadedMediaUrls.length === 0) {
        outgoingRequests.push(request);
      } else {
        uploadedMediaUrls.forEach((mediaUrl, index) => {
          outgoingRequests.push({
            recipientId,
            message: index === 0 ? content : '',
            mediaUrl
          });
        });
      }

      for (const outgoingRequest of outgoingRequests) {
        const createdMessage = await firstValueFrom(this.messageService.sendMessage(outgoingRequest));
        this.selectedConversation.messages.push(this.mapSentMessageToUI(outgoingRequest, createdMessage));
      }

      const lastMessageText = content
        || (uploadedMediaUrls.length > 1 ? `📎 ${uploadedMediaUrls.length} tệp đính kèm` : '📎 Tệp đính kèm');

      this.selectedConversation.lastMessage = lastMessageText;
      this.selectedConversation.lastMessageTime = new Date();

      this.messageForm.reset();
      this.clearSelectedMedia();
      this.loadConversations();
    } catch (err: any) {
      console.error('Failed to send message', err);
      alert('Failed to send message: ' + (err?.error?.message || err?.message || 'Unknown error'));
    } finally {
      this.isSending = false;
    }
  }

  isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  isVideoFile(file: File): boolean {
    return file.type.startsWith('video/');
  }

  isImageUrl(url: string): boolean {
    return /\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url);
  }

  isVideoUrl(url: string): boolean {
    return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(url);
  }

  formatFileSize(size: number): string {
    if (size < 1024) {
      return `${size} B`;
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  trackByPreviewUrl(_: number, media: MediaPreview): string {
    return media.previewUrl;
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  }

  formatMessageTime(date: Date): string {
    return date.toLocaleTimeString('vi-VN', {hour: '2-digit', minute: '2-digit'});
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  private mapSentMessageToUI(request: SendMessageRequest, response: SendMessageApiResponse | null): Message {
    const currentUser = this.authService.currentUserValue;

    return {
      id: response?.id ?? Date.now() + Math.floor(Math.random() * 1000),
      senderId: String(response?.sender?.id ?? currentUser?.id ?? 'me'),
      senderName: response?.sender?.displayName ?? currentUser?.name ?? 'You',
      content: response?.message ?? request.message,
      mediaUrl: response?.mediaUrl ?? request.mediaUrl,
      timestamp: this.parseConversationTime(response?.createdAt),
      isCurrentUser: true
    };
  }
}

export default MessagesComponent;
