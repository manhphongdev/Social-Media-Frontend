import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable, from} from 'rxjs';
import {map} from 'rxjs/operators';
import {BaseResponse} from '../models/base.model';

export interface ConversationParticipant {
  id: number;
  displayName: string;
  avatar?: string | null;
  isOnline: boolean;
  lastSeen?: string | null;
}

export interface ConversationLastMessage {
  id: number;
  message?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  isRead?: boolean | null;
  createdAt: string;
  sender?: unknown;
  conversationId: number;
}

export interface ConversationApiResponse {
  id: number;
  type: 'DIRECT' | 'GROUP';
  lastMessageAt?: string | null;
  participants: ConversationParticipant[];
  lastMessage?: ConversationLastMessage | null;
}

export interface ApiEnvelope<T> {
  status: number;
  message: string;
  timestamp: string;
  data: T;
}

export interface SendMessageApiResponse {
  id: number;
  message?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  isRead?: boolean | null;
  createdAt: string;
  sender?: {
    id: number;
    displayName: string;
    avatar?: string | null;
    isOnline?: boolean;
    lastSeen?: string | null;
  } | null;
  conversationId: number;
}

export type ConversationMessageApiResponse = SendMessageApiResponse;

export interface SendMessageRequest {
  recipientId: number;
  message: string;
  mediaUrl?: string;
}

export interface GenerateUploadUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface PresignedUploadResponse {
  uploadId: string;
  method: string;
  uploadUrl: string;
  headers: Record<string, string>;
  objectKey: string;
  fileUrl: string;
  expiresAt: string;
  maxFileSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = 'http://localhost:8888/messages';
  private conversationApiUrl = 'http://localhost:8888/conversations';
  private uploadApiUrl = 'http://localhost:8888/uploads';

  constructor(private http: HttpClient) {
  }

  sendMessage(request: SendMessageRequest): Observable<SendMessageApiResponse | null> {
    const formData = new FormData();
    formData.append('recipientId', request.recipientId.toString());
    formData.append('message', request.message);

    if (request.mediaUrl) {
      formData.append('mediaUrl', request.mediaUrl);
    }

    return this.http.post<ApiEnvelope<SendMessageApiResponse | null>>(this.apiUrl, formData)
      .pipe(map(response => response.data ?? null));
  }

  getConversations(userId: number, cursor?: string, limit: number = 20): Observable<ConversationApiResponse[]> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('limit', limit.toString());

    if (cursor) {
      params = params.set('cursor', cursor);
    }

    return this.http.get<ApiEnvelope<ConversationApiResponse[]>>(`${this.conversationApiUrl}/`, {params})
      .pipe(map(response => response.data || []));
  }

  getMessages(conversationId: number): Observable<ConversationMessageApiResponse[]> {
    const params = new HttpParams().set('conversationId', conversationId.toString());

    return this.http.get<ApiEnvelope<ConversationMessageApiResponse[]>>(`${this.conversationApiUrl}/${conversationId}/messages`, {params})
      .pipe(map(response => response.data || []));
  }

  generateUploadUrl(file: File): Observable<PresignedUploadResponse> {
    const payload: GenerateUploadUrlRequest = {
      fileName: file.name,
      contentType: file.type,
      fileSize: file.size
    };

    return this.http.post<BaseResponse<PresignedUploadResponse>>(`${this.uploadApiUrl}/pre-signed`, payload)
      .pipe(map(response => response.data));
  }

  uploadFileToPresignedUrl(file: File, presignedData: PresignedUploadResponse): Observable<void> {
    const uploadPromise = fetch(presignedData.uploadUrl, {
      method: presignedData.method || 'PUT',
      headers: presignedData.headers,
      body: file
    }).then((response) => {
      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }
    });

    return from(uploadPromise);
  }
}
