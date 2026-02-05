export interface ReactionCount {
  like: number;
  love: number;
}

export interface Comment {
  id: number;
  author: string;
  content: string;
  time: string;
  replies: Comment[];
}

export type PrivacyMode = 'public' | 'friends' | 'private';

export interface Attachment {
  id: string;
  type: 'image' | 'video' | 'document';
  url: string;
  name: string;
  size?: number;
}

export interface Post {
  id: number;
  author: string;
  content: string;
  time: string;
  reactions: ReactionCount;
  comments: Comment[];
  privacy: PrivacyMode;
  attachments?: Attachment[];
}
