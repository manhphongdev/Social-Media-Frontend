import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../services/auth.service';
import { RegisterRequest } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form: any;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(20)]],
      confirmPassword: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required]],
      gender: ['', [Validators.required]]
    }, {
      validators: RegisterComponent.passwordMatchValidator
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  static passwordMatchValidator(form: any) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  submit() {
    if (this.form.invalid) {
      this.errorMessage = 'Vui lòng điền đầy đủ thông tin hợp lệ';
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const registerRequest: RegisterRequest = {
      name: this.form.value.name,
      email: this.form.value.email,
      password: this.form.value.password,
      confirmPassword: this.form.value.confirmPassword,
      gender: this.form.value.gender,
      dateOfBirth: this.form.value.dateOfBirth
    };

    this.authService.register(registerRequest).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || 'Đăng ký thành công!';

        // Navigate to home page after successful registration
        setTimeout(() => {
          this.router.navigateByUrl('/');
        }, 1500);
      },
      error: (error) => {
        this.loading = false;
        console.error('Lỗi đăng ký:', error);

        // Handle different error scenarios
        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else if (error.status === 0) {
          this.errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
        } else if (error.status === 400) {
          this.errorMessage = 'Thông tin đăng ký không hợp lệ.';
        } else if (error.status === 409) {
          this.errorMessage = 'Email đã được sử dụng.';
        } else {
          this.errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
        }
      }
    });
  }
}

export default RegisterComponent;
