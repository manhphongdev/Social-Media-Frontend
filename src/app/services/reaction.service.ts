import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {timeout} from 'rxjs/operators';
import {ApiResponse} from '../models/notification.model'; // Reuse ApiResponse

export enum ReactionType {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY'
}

export interface CreateReactionRequest {
  postId: number;
  reactionType: ReactionType;
}

@Injectable({
  providedIn: 'root'
})
export class ReactionService {
  private apiUrl = 'http://localhost:8888/reactions';

  constructor(private http: HttpClient) {
  }

  /**
   * Create or update a reaction
   */
  createReaction(postId: number, type: ReactionType): Observable<any> {
    const request: CreateReactionRequest = {
      postId,
      reactionType: type
    };

    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/create`, request)
      .pipe(timeout(10000));
  }
   
  /**
   * Remove a reaction (unlike)
   * The backend expects 'id' param which is actually the postId
   */
  removeReaction(postId: number): Observable<any> {
    return this.http.delete<ApiResponse<any>>(this.apiUrl, {
      params: new HttpParams().set('id', postId.toString())
    }).pipe(timeout(10000));
  }

  /**
   * Get reactions for a post
   */
  getReactions(postId: number): Observable<any> {
    const params = new HttpParams().set('postId', postId.toString());
    return this.http.get<ApiResponse<any>>(this.apiUrl, {params})
      .pipe(timeout(10000));
  }
}
