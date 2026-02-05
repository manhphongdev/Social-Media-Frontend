import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Post, Comment, Attachment, PrivacyMode } from '../../models/post.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent {
  postForm: FormGroup;
  commentForms = new Map<number, FormGroup>();
  replyForms = new Map<number, FormGroup>();

  posts: Post[] = [];
  // track reactions by current user (simple client-side tracking)
  likedPostIds = new Set<number>();
  lovedPostIds = new Set<number>();

  // File upload handling
  selectedFiles: File[] = [];
  filePreviews: { file: File; preview: string; type: string }[] = [];

  constructor(private fb: FormBuilder) {
    this.postForm = this.fb.group({
      content: ['', [Validators.required, Validators.maxLength(500)]],
      privacy: ['public', Validators.required],
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
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just add metadata
        this.filePreviews.push({
          file,
          preview: '',
          type: fileType
        });
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
    if (this.postForm.invalid) return;

    // Create attachments from selected files (simulation - in real app would upload to server)
    const attachments: Attachment[] = this.selectedFiles.map((file, index) => ({
      id: `${Date.now()}-${index}`,
      type: this.getFileType(file),
      url: this.filePreviews[index]?.preview || URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    const post: Post = {
      id: Date.now(),
      author: 'You',
      content: this.postForm.value.content,
      time: 'Vừa xong',
      reactions: { like: 0, love: 0 },
      comments: [],
      privacy: this.postForm.value.privacy as PrivacyMode,
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    this.posts = [post, ...this.posts];
    this.postForm.reset({ privacy: 'public' });
    this.selectedFiles = [];
    this.filePreviews = [];
  }

  private getFileType(file: File): 'image' | 'video' | 'document' {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    return 'document';
  }

  getPrivacyIcon(privacy: PrivacyMode): string {
    const icons = {
      public: '🌐',
      friends: '👥',
      private: '🔒'
    };
    return icons[privacy];
  }

  getPrivacyLabel(privacy: PrivacyMode): string {
    const labels = {
      public: 'Công khai',
      friends: 'Bạn bè',
      private: 'Riêng tư'
    };
    return labels[privacy];
  }

  // ---------- REACTION ----------
  // Toggle reaction: add or remove user's reaction and update counts
  toggleReaction(post: Post, type: 'like' | 'love'): void {
    const set = type === 'like' ? this.likedPostIds : this.lovedPostIds;
    if (set.has(post.id)) {
      // remove reaction
      set.delete(post.id);
      post.reactions[type] = Math.max(0, post.reactions[type] - 1);
    } else {
      // add reaction
      set.add(post.id);
      post.reactions[type] = (post.reactions[type] || 0) + 1;
    }
  }

  // ---------- COMMENT ----------
  getCommentForm(postId: number): FormGroup {
    if (!this.commentForms.has(postId)) {
      this.commentForms.set(
        postId,
        this.fb.group({
          content: ['', Validators.required],
        })
      );
    }
    return this.commentForms.get(postId)!;
  }

  addComment(post: Post): void {
    const form = this.getCommentForm(post.id);
    if (form.invalid) return;

    const comment: Comment = {
      id: Date.now(),
      author: 'You',
      content: form.value.content,
      time: 'Vừa xong',
      replies: [],
    };

    post.comments.push(comment);
    form.reset();
  }

  // ---------- REPLY ----------
  getReplyForm(commentId: number): FormGroup {
    if (!this.replyForms.has(commentId)) {
      this.replyForms.set(
        commentId,
        this.fb.group({
          content: ['', Validators.required],
        })
      );
    }
    return this.replyForms.get(commentId)!;
  }

  addReply(comment: Comment): void {
    const form = this.getReplyForm(comment.id);
    if (form.invalid) return;

    comment.replies.push({
      id: Date.now(),
      author: 'You',
      content: form.value.content,
      time: 'Vừa xong',
      replies: [],
    });

    form.reset();
  }
}

export default HomeComponent;

