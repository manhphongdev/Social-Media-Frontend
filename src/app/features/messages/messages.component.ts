import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Conversation, Message } from '../../models/message.model';

@Component({
    selector: 'app-messages',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './messages.component.html',
    styleUrls: ['./messages.component.css']
})
export class MessagesComponent implements OnInit {
    conversations: Conversation[] = [];
    selectedConversation: Conversation | null = null;
    messageForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.messageForm = this.fb.group({
            content: ['', Validators.required]
        });
    }

    ngOnInit() {
        this.loadMockConversations();
    }

    loadMockConversations() {
        // Mock data cho demo
        this.conversations = [
            {
                id: 1,
                userId: 'user1',
                userName: 'Nguyễn Văn A',
                lastMessage: 'Chào bạn! Bạn khỏe không?',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 5), // 5 phút trước
                unreadCount: 2,
                isOnline: true,
                messages: [
                    {
                        id: 1,
                        senderId: 'user1',
                        senderName: 'Nguyễn Văn A',
                        content: 'Xin chào!',
                        timestamp: new Date(Date.now() - 1000 * 60 * 10),
                        isCurrentUser: false
                    },
                    {
                        id: 2,
                        senderId: 'me',
                        senderName: 'You',
                        content: 'Chào bạn!',
                        timestamp: new Date(Date.now() - 1000 * 60 * 8),
                        isCurrentUser: true
                    },
                    {
                        id: 3,
                        senderId: 'user1',
                        senderName: 'Nguyễn Văn A',
                        content: 'Chào bạn! Bạn khỏe không?',
                        timestamp: new Date(Date.now() - 1000 * 60 * 5),
                        isCurrentUser: false
                    }
                ]
            },
            {
                id: 2,
                userId: 'user2',
                userName: 'Trần Thị B',
                lastMessage: 'Cảm ơn bạn nhé!',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 phút trước
                unreadCount: 0,
                isOnline: false,
                messages: [
                    {
                        id: 4,
                        senderId: 'me',
                        senderName: 'You',
                        content: 'Không có gì đâu!',
                        timestamp: new Date(Date.now() - 1000 * 60 * 35),
                        isCurrentUser: true
                    },
                    {
                        id: 5,
                        senderId: 'user2',
                        senderName: 'Trần Thị B',
                        content: 'Cảm ơn bạn nhé!',
                        timestamp: new Date(Date.now() - 1000 * 60 * 30),
                        isCurrentUser: false
                    }
                ]
            },
            {
                id: 3,
                userId: 'user3',
                userName: 'Lê Văn C',
                lastMessage: 'Hẹn gặp lại!',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 giờ trước
                unreadCount: 0,
                isOnline: true,
                messages: [
                    {
                        id: 6,
                        senderId: 'user3',
                        senderName: 'Lê Văn C',
                        content: 'Hẹn gặp lại!',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                        isCurrentUser: false
                    }
                ]
            },
            {
                id: 4,
                userId: 'user4',
                userName: 'Phạm Thị D',
                lastMessage: 'Tuyệt vời! 🎉',
                lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 ngày trước
                unreadCount: 1,
                isOnline: false,
                messages: [
                    {
                        id: 7,
                        senderId: 'user4',
                        senderName: 'Phạm Thị D',
                        content: 'Tuyệt vời! 🎉',
                        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                        isCurrentUser: false
                    }
                ]
            }
        ];
    }

    selectConversation(conversation: Conversation) {
        this.selectedConversation = conversation;
        // Clear unread count khi mở conversation
        conversation.unreadCount = 0;
    }

    sendMessage() {
        if (this.messageForm.invalid || !this.selectedConversation) return;

        const newMessage: Message = {
            id: Date.now(),
            senderId: 'me',
            senderName: 'You',
            content: this.messageForm.value.content,
            timestamp: new Date(),
            isCurrentUser: true
        };

        this.selectedConversation.messages.push(newMessage);
        this.selectedConversation.lastMessage = newMessage.content;
        this.selectedConversation.lastMessageTime = newMessage.timestamp;

        this.messageForm.reset();
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
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    }
}

export default MessagesComponent;
