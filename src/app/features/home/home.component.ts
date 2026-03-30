import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ReactiveFormsModule, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {Post, PostPrivacy} from '../../models/post.model';
import {PostService, CreatePostRequest} from '../../services/post.service';
import {ReactionService, ReactionType} from '../../services/reaction.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  postForm: FormGroup;
  // commentForms and replyForms placeholders for future use
  commentForms = new Map<number, FormGroup>();
  replyForms = new Map<number, FormGroup>();

  posts: Post[] = [];

  // File upload handling
  selectedFiles: File[] = [];
  filePreviews: { file: File; preview: string; type: string }[] = [];

  // Loading states
  creatingPost = false;
  loadingPosts = false;
  error = '';

  constructor(
    private fb: FormBuilder,
    private postService: PostService,
    private reactionService: ReactionService,
    private cdr: ChangeDetectorRef
  ) {
    this.postForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(3000)]],
      privacy: ['PUBLIC', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  /**
   * Load posts from API
   */
  loadPosts(): void {
    this.loadingPosts = true;
    this.error = '';
    this.cdr.detectChanges();

    this.postService.getPostsWithCursor(undefined, 20).subscribe({
      next: (response) => {
        this.posts = response.content;
        this.loadingPosts = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading posts:', error);
        this.error = 'Không thể tải bài viết. Vui lòng thử lại.';
        this.loadingPosts = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- FILE UPLOAD ----------
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    this.selectedFiles = [...this.selectedFiles, ...files];

    // Create previews for images
    files.forEach(file => {
      const reader = new FileReader();
      const fileType = file.type.split('/')[0]; // 'image', 'video', etc.

      if (fileType === 'image') {
        reader.onload = (e) => {
          this.filePreviews.push({
            file,
            preview: e.target?.result as string,
            type: fileType
          });
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just add metadata
        this.filePreviews.push({
          file,
          preview: '',
          type: fileType
        });
        this.cdr.detectChanges();
      }
    });

    // Reset input
    input.value = '';
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.filePreviews.splice(index, 1);
  }

  // ---------- POST ----------
  addPost(): void {
    if (this.postForm.invalid) {
      alert('Vui lòng nhập nội dung bài viết!');
      return;
    }

    this.creatingPost = true;
    this.error = '';
    this.postForm.disable();
    this.cdr.detectChanges();

    const request: CreatePostRequest = {
      text: this.postForm.get('content')?.value,
      privacy: this.postForm.get('privacy')?.value as PostPrivacy
    };

    console.log('Creating post:', request);
    console.log('Files:', this.selectedFiles);

    this.postService.createPost(request, this.selectedFiles).subscribe({
      next: (response) => {
        console.log('Post created successfully:', response);
        this.creatingPost = false;

        // Enable form and reset
        this.postForm.enable();
        this.postForm.reset({privacy: 'PUBLIC'});
        this.selectedFiles = [];
        this.filePreviews = [];

        // Reload posts to show the new post
        this.loadPosts();

        alert('Đăng bài thành công!');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error creating post:', error);
        this.creatingPost = false;

        // Enable form on error
        this.postForm.enable();

        this.error = error.error?.message || 'Không thể đăng bài. Vui lòng thử lại.';
        alert(this.error);
        this.cdr.detectChanges();
      }
    });
  }

  // ---------- REACTION ----------
  toggleReaction(post: Post, type: string): void {
    // TODO: Since backend doesn't return isReacted yet, logic here is optimistic and basic

    const reactionType = type.toUpperCase() as ReactionType;

    this.reactionService.createReaction(post.postId, reactionType).subscribe({
      next: () => {
        console.log('Reaction created');
        // Update UI
        // Ideally we should know if we liked or unliked.
        // For now, assume it's like and increment.
        // In real app, we check if user already reacted.
        post.reactionCount++;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to react', err);
      }
    });
  }

  // ---------- HELPERS ----------
  private getFileType(file: File): 'image' | 'video' | 'document' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  }

  getPrivacyIcon(privacy: string): string {
    const icons: { [key: string]: string } = {
      'PUBLIC': '🌐',
      'FRIENDS_ONLY': '👥',
      'PRIVATE': '🔒'
    };
    return icons[privacy] || '🌐';
  }

  getPrivacyLabel(privacy: string): string {
    const labels: { [key: string]: string } = {
      'PUBLIC': 'Công khai',
      'FRIENDS_ONLY': 'Bạn bè',
      'PRIVATE': 'Riêng tư'
    };
    return labels[privacy] || 'Công khai';
  }

  getTimeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Vừa xong';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} phút trước`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} giờ trước`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} ngày trước`;

    return date.toLocaleDateString('vi-VN');
  }

  // Mock methods for template compatibility
  addComment(post: Post): void {
    console.log('Add comment clicked for post:', post.postId);
  }
}

export default HomeComponent;
