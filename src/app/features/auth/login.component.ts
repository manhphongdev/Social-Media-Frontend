import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Router, RouterModule} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
import {AuthService} from '../../services/auth.service';
import {LoginRequest} from '../../models/user.model';
import {WebSocketService} from '../../services/websocket.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form: any;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private wsService: WebSocketService
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]]
    });
  }

  submit() {
    if (this.form.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const loginRequest: LoginRequest = {
      username: this.form.value.username,
      password: this.form.value.password
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.loading = false;
        this.successMessage = response.message || 'Đăng nhập thành công!';
        console.log('Success message set to:', this.successMessage);

        // Connect to WebSocket if token is available
        if (response.data?.accessToken) {
          this.wsService.connect(response.data.accessToken);
        }

        // Navigate to home page after successful login
        setTimeout(() => {
          this.router.navigateByUrl('/');
        }, 2000); // Increased from 1000ms to 2000ms to show success message longer
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi đăng nhập:', error);

        // Handle different error scenarios
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 0) {
          this.errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
        } else if (error.status === 401) {
          this.errorMessage = 'Email hoặc mật khẩu không đúng.';
        } else if (error.status === 404) {
          this.errorMessage = 'Tài khoản không tồn tại.';
        } else {
          this.errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
        }
      }
    });
  }
}

export default LoginComponent;
