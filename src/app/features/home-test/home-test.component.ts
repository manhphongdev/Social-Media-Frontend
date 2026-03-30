import {Component, OnInit, ChangeDetectorRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PostService} from '../../services/post.service';
import {ReactionService, ReactionType} from '../../services/reaction.service';
import {CommentService, CreateCommentRequest} from '../../services/comment.service';
import {Post} from '../../models/post.model';

@Component({
  selector: 'app-home-test',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-test.component.html',
  styleUrls: ['./home-test.component.css']
})
export class HomeTestComponent implements OnInit {
  posts: Post[] = [];
  loadingPosts = false;
  error = '';

  constructor(
    private postService: PostService,
    private reactionService: ReactionService,
    private commentService: CommentService,
    private cdr: ChangeDetectorRef
  ) {
  }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.loadingPosts = true;
    this.error = '';

    this.postService.getAllPosts().subscribe({
      next: (posts) => {
        this.posts = posts;
        this.loadingPosts = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading posts', err);
        this.error = 'Failed to load posts from /all API';
        this.loadingPosts = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleReaction(post: Post, type: string): void {
    const reactionType = type.toUpperCase() as ReactionType;

    this.reactionService.createReaction(post.postId, reactionType).subscribe({
      next: () => {
        console.log('Reaction created');
        post.reactionCount++;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to react', err);
        alert('Failed to react: ' + (err.error?.message || err.message));
      }
    });
  }

  toggleCommentSection(post: Post): void {
    // Focus on input
    const input = document.getElementById('comment-input-' + post.postId);
    if (input) {
      input.focus();
    }
  }

  submitComment(post: Post, event?: Event): void {
    if (event) {
      event.preventDefault(); // Prevent new line if enter key
    }

    const input = document.getElementById('comment-input-' + post.postId) as HTMLTextAreaElement;
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    const request: CreateCommentRequest = {
      postId: post.postId,
      content: content
    };

    this.commentService.createComment(request).subscribe({
      next: () => {
        console.log('Comment created');
        post.commentCount++;
        input.value = ''; // Clear input
        alert('Comment posted!');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Failed to comment', err);
        alert('Failed to comment: ' + (err.error?.message || err.message));
      }
    });
  }

  // Helpers
  getTimeAgo(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

    return date.toLocaleDateString();
  }

  getPrivacyLabel(privacy: string): string {
    return privacy;
  }
}
