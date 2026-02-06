import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ProfileResponse, User } from '../models/user.model';

@Injectable({
    providedIn: 'root'
})
export class ProfileService {
    private apiUrl = 'http://localhost:8888/users/profile';
    private usersApiUrl = 'http://localhost:8888/users';

    constructor(private http: HttpClient) { }

    /**
     * Get current user's profile
     * Authorization header will be automatically added by AuthInterceptor
     */
    getMyProfile(): Observable<User> {
        return this.http.get<ProfileResponse>(`${this.apiUrl}/me`)
            .pipe(
                map(response => response.data)
            );
    }

    /**
     * Update current user's profile
     * PUT /users/profile
     */
    updateProfile(profileData: Partial<User>): Observable<User> {
        return this.http.put<ProfileResponse>(`${this.usersApiUrl}/profile`, profileData)
            .pipe(
                map(response => response.data),
                tap(profile => console.log('✅ Profile updated:', profile))
            );
    }

    /**
     * Upload avatar
     * Backend response: { status, message, timestamp } - no data field
     */
    uploadAvatar(file: File): Observable<any> {
        const formData = new FormData();
        formData.append('avatar', file);

        return this.http.patch<{ status: number; message: string; timestamp: string }>(
            `${this.usersApiUrl}/avatar`,
            formData
        ).pipe(
            tap(response => console.log('Avatar upload response:', response))
        );
    }
}
