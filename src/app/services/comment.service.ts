import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {BaseResponse} from '../models/base.model';

export interface CreateCommentRequest {
  postId: number;
  content: string;
}

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private apiUrl = 'http://localhost:8888/comments';

  constructor(private http: HttpClient) {
  }

  createComment(request: CreateCommentRequest): Observable<BaseResponse<any>> {
    return this.http.post<BaseResponse<any>>(`${this.apiUrl}/create`, request);
  }
}
