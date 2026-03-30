import {Component, OnInit, ChangeDetectorRef, HostListener} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ProfileService} from '../../services/profile.service';
import {PostService} from '../../services/post.service';
import {User} from '../../models/user.model';
import {Post, CursorPageResponse} from '../../models/post.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: User | null = null;
  loading = true;
  error = '';

  // Avatar upload state
  uploadingAvatar = false;
  loadingPreview = false;
  avatarPreview: string | null = null;
  selectedFile: File | null = null;

  // Edit profile state
  isEditMode = false;
  editForm: FormGroup;
  savingProfile = false;

  // Posts state
  posts: Post[] = [];
  loadingPosts = false;
  postsError = '';
  nextCursor: string | null = null;
  hasMorePosts = false;
  isLoadingMore = false;

  constructor(
    private profileService: ProfileService,
    private postService: PostService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    // Initialize edit form
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      bio: ['', Validators.maxLength(500)],
      dateOfBirth: [''],
      gender: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadPosts();
  }

  loadProfile(): void {
    this.loading = true;
    this.error = '';

    console.log('🔍 Loading profile...');
    console.log('📌 Access Token:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');

    this.profileService.getMyProfile().subscribe({
      next: (profile) => {
        console.log('✅ Profile loaded successfully:', profile);
        console.log('📝 Bio field:', profile.bio ? `"${profile.bio}"` : 'MISSING/EMPTY');
        this.profile = profile;
        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      },
      error: (error) => {
        console.error('❌ Error loading profile:', error);
        console.log('Error status:', error.status);
        console.log('Error message:', error.message);
        console.log('Error details:', error.error);

        // Detailed error messages
        if (error.status === 0) {
          this.error = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n1. Backend có đang chạy?\n2. CORS có được cấu hình?';
        } else if (error.status === 401) {
          this.error = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
        } else if (error.status === 403) {
          this.error = 'Bạn không có quyền truy cập.';
        } else if (error.status === 404) {
          this.error = 'Không tìm thấy thông tin profile.';
        } else {
          this.error = error.error?.message || 'Không thể tải thông tin profile. Vui lòng thử lại.';
        }

        this.loading = false;
        this.cdr.detectChanges(); // Force UI update
      }
    });
  }


  /**
   * Handle file selection for avatar
   */
  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh!');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB!');
        return;
      }

      this.selectedFile = file;
      this.loadingPreview = true; // Start loading
      console.log('📁 File selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
      this.cdr.detectChanges(); // Update UI to show loading

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target?.result as string;
        this.loadingPreview = false; // Finish loading
        console.log('✅ Preview ready');
        this.cdr.detectChanges(); // Force UI update for preview
      };
      reader.onerror = () => {
        this.loadingPreview = false;
        alert('Không thể đọc file ảnh!');
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  /**
   * Upload selected avatar
   */
  uploadAvatar(): void {
    if (!this.selectedFile) {
      alert('Vui lòng chọn ảnh trước!');
      return;
    }

    this.uploadingAvatar = true;
    console.log('📤 Uploading avatar...', this.selectedFile.name);

    this.profileService.uploadAvatar(this.selectedFile).subscribe({
      next: (response) => {
        console.log('✅ Avatar uploaded successfully:', response);
        this.uploadingAvatar = false;

        // Reload profile to get updated avatar URL
        this.loadProfile();

        // Clear preview
        this.avatarPreview = null;
        this.selectedFile = null;

        alert('Cập nhật avatar thành công!');
      },
      error: (error) => {
        console.error('❌ Error uploading avatar:', error);
        this.uploadingAvatar = false;
        alert(error.error?.message || 'Không thể upload avatar. Vui lòng thử lại.');
      }
    });
  }

  /**
   * Cancel avatar selection
   */
  cancelAvatarUpload(): void {
    this.avatarPreview = null;
    this.selectedFile = null;
  }

  /**
   * Trigger file input click
   */
  triggerFileInput(): void {
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    fileInput?.click();
  }

  /**
   * Enter edit mode and populate form with current profile data
   */
  enterEditMode(): void {
    if (!this.profile) return;

    this.isEditMode = true;
    this.editForm.patchValue({
      name: this.profile.name || '',
      bio: this.profile.bio || '',
      dateOfBirth: this.profile.dateOfBirth || '',
      gender: this.profile.gender || ''
    });
    this.cdr.detectChanges();
  }

  /**
   * Cancel edit mode and revert changes
   */
  cancelEdit(): void {
    this.isEditMode = false;
    this.editForm.reset();
    this.cdr.detectChanges();
  }

  /**
   * Save profile changes
   */
  saveProfile(): void {
    if (this.editForm.invalid) {
      alert('Vui lòng kiểm tra lại thông tin!');
      return;
    }

    this.savingProfile = true;
    const updateData = this.editForm.value;

    console.log('💾 Saving profile:', updateData);

    this.profileService.updateProfile(updateData).subscribe({
      next: (updatedProfile) => {
        console.log('✅ Profile saved (Server Response):', updatedProfile);

        // Reload all data from server to be sure
        this.loadProfile();

        this.isEditMode = false;
        this.savingProfile = false;
        alert('Cập nhật profile thành công!');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error saving profile:', error);
        this.savingProfile = false;
        alert(error.error?.message || 'Không thể cập nhật profile. Vui lòng thử lại.');
        this.cdr.detectChanges();
      }
    });
  }

  getAvatarInitial(): string {
    return this.profile?.name?.charAt(0).toUpperCase() || 'U';
  }

  getFormattedDate(date?: string): string {
    if (!date) return 'Chưa cập nhật';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  }

  getGenderText(gender?: string): string {
    const genderMap: { [key: string]: string } = {
      'MALE': 'Nam',
      'FEMALE': 'Nữ',
      'OTHER': 'Khác'
    };
    return gender ? genderMap[gender] : 'Chưa cập nhật';
  }

  /**
   * Load posts with cursor-based pagination
   */
  loadPosts(cursor?: string): void {
    if (cursor) {
      this.isLoadingMore = true;
    } else {
      this.loadingPosts = true;
      this.posts = [];
    }
    this.postsError = '';

    console.log('📚 Loading posts with cursor:', cursor || 'initial');

    this.postService.getPostsWithCursor(cursor, 10).subscribe({
      next: (response: CursorPageResponse<Post>) => {
        console.log('✅ Posts loaded:', response);

        if (cursor) {
          // Append to existing posts
          this.posts = [...this.posts, ...response.content];
        } else {
          // Initial load
          this.posts = response.content;
        }

        this.nextCursor = response.nextCursor;
        this.hasMorePosts = response.hasNext;
        this.loadingPosts = false;
        this.isLoadingMore = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ Error loading posts:', error);
        this.postsError = 'Không thể tải bài viết. Vui lòng thử lại.';
        this.loadingPosts = false;
        this.isLoadingMore = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load more posts (infinite scroll)
   */
  loadMorePosts(): void {
    if (this.hasMorePosts && !this.isLoadingMore && this.nextCursor) {
      this.loadPosts(this.nextCursor);
    }
  }

  /**
   * Detect scroll to bottom for infinite scrolling
   */
  @HostListener('window:scroll')
  onScroll(): void {
    const scrollPosition = window.innerHeight + window.scrollY;
    const documentHeight = document.documentElement.scrollHeight;

    // Load more when user scrolls to 80% of the page
    if (scrollPosition >= documentHeight * 0.8) {
      this.loadMorePosts();
    }
  }

  /**
   * Get privacy badge text
   */
  getPrivacyText(privacy: string): string {
    const privacyMap: { [key: string]: string } = {
      'PUBLIC': 'Công khai',
      'FRIENDS_ONLY': 'Bạn bè',
      'PRIVATE': 'Riêng tư'
    };
    return privacyMap[privacy] || privacy;
  }

  /**
   * Format time ago
   */
  getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  }
}

export default ProfileComponent;
