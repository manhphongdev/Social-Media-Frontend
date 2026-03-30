/**
 * Notification model matching backend API response
 */
export interface Notification {
  id: number;
  text: string | null;
  type: NotificationType;
  targetType: TargetType;
  targetId: number;
  isRead: boolean;
  fromUser: NotificationUser | null;
  createdAt: string | null;
}

/**
 * User information in notification
 */
export interface NotificationUser {
  id: number;
  name: string;
  username: string;
  avatarUrl?: string;
}

/**
 * Notification types
 */
export enum NotificationType {
  REACTION = 'REACTION',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM'
}

/**
 * Target types for notifications
 */
export enum TargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
  USER = 'USER'
}

/**
 * Paginated notification response
 */
export interface NotificationResponse {
  content: Notification[];
  nextCursor: string | null;
  hasNext: boolean;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  status: number;
  message: string;
  timestamp: string;
  data: T;
}

/**
 * Unread count response
 */
export interface UnreadCountResponse {
  count: number;
}
