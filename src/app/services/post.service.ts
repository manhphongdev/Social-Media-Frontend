import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map, timeout} from 'rxjs/operators';
import {Post, PostsResponse, CursorPageResponse, PostPrivacy} from '../models/post.model';
import {BaseResponse} from '../models/base.model';

// Request interface for creating a post
export interface CreatePostRequest {
  text: string;
  privacy: PostPrivacy;
}

// Response interface for create post
export interface CreatePostResponse {
  status: number;
  message: string;
  timestamp?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private apiUrl = 'http://localhost:8888/posts';

  constructor(private http: HttpClient) {
  }

  /**
   * Create a new post with optional media files
   * @param request - Post creation request (text, privacy)
   * @param files - Optional media files (images/videos)
   * @returns Observable of CreatePostResponse
   */
  createPost(request: CreatePostRequest, files?: File[]): Observable<CreatePostResponse> {
    const formData = new FormData();

    // Append text and privacy as form fields
    formData.append('text', request.text);
    formData.append('privacy', request.privacy);

    // Append files if provided
    if (files && files.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    return this.http.post<CreatePostResponse>(`${this.apiUrl}/create`, formData)
      .pipe(timeout(10000));
  }

  /**
   * Get posts with cursor-based pagination
   * @param cursor - Optional cursor for pagination
   * @param limit - Number of posts per page (default: 10)
   * @returns Observable of CursorPageResponse containing posts
   */
  getPostsWithCursor(cursor?: string, limit: number = 10): Observable<CursorPageResponse<Post>> {
    let params = new HttpParams().set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http.get<PostsResponse>(this.apiUrl, {params})
      .pipe(
        timeout(10000),
        map(response => response.data)
      );
  }

  /**
   * Get a single post by ID
   * @param id - Post ID
   * @returns Observable of Post
   */
  getPostById(id: number): Observable<Post> {
    return this.http.get<PostsResponse>(`${this.apiUrl}/${id}`)
      .pipe(
        map(response => response.data as any as Post)
      );
  }

  getAllPosts(): Observable<Post[]> {
    return this.http.get<BaseResponse<Post[]>>(`${this.apiUrl}/all`).pipe(
      timeout(10000),
      map(response => response.data)
    );
  }
}
