// Author information in a post
export interface PostAuthor {
  id: number;
  name: string;
  avatarUrl?: string;
}

// Privacy settings matching backend enum
export type PostPrivacy = 'PUBLIC' | 'FRIENDS_ONLY' | 'PRIVATE';

// Post response from backend (CRUDPostResponse)
export interface Post {
  postId: number;
  author: PostAuthor;
  caption: string;
  mediaUrl: string[];
  privacy: PostPrivacy;
  reactionCount: number;
  commentCount: number;
  createdAt: string;
}

// Cursor-based pagination response
export interface CursorPageResponse<T> {
  content: T[];
  nextCursor: string | null;
  hasNext: boolean;
}

// API Response wrapper
export interface PostResponse {
  status: number;
  message: string;
  data: Post;
}

export interface PostsResponse {
  status: number;
  message: string;
  data: CursorPageResponse<Post>;
}
