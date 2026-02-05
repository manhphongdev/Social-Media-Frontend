export interface Message {
    id: number;
    senderId: string;
    senderName: string;
    content: string;
    timestamp: Date;
    isCurrentUser: boolean;
}

export interface Conversation {
    id: number;
    userId: string;
    userName: string;
    userAvatar?: string;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
    isOnline: boolean;
    messages: Message[];
}
