# Debug Guide - Profile Loading Issue

## Các bước kiểm tra khi profile bị treo

### 1. Mở Chrome DevTools (F12)

### 2. Tab Console

Kiểm tra các log messages:

- `🔍 Loading profile...` - Request đã được gửi
- `📌 Access Token: EXISTS/MISSING` - Token có tồn tại không?
- `✅ Profile loaded successfully` - Success
- `❌ Error loading profile` - Có lỗi

### 3. Tab Network

Tìm request: `profile/me`

**Request Headers - Phải có:**

```
Authorization: Bearer eyJ0eXAiOi...
```

**Nếu không có Authorization header:**
→ AuthInterceptor chưa hoạt động hoặc không có token

**Response:**

- Status 200: OK → Check response body
- Status 401: Unauthorized → Token invalid/expired
- Status 0 or Failed: CORS/Network error

### 4. Common Issues & Solutions

#### Issue #1: CORS Error

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution:** Backend cần cấu hình CORS:

```java
.allowedOrigins("http://localhost:4200")
.allowCredentials(true)
```

#### Issue #2: No Authorization Header

**Check localStorage:**

```javascript
localStorage.getItem('accessToken') // Phải có value
```

**Solution:**

- Login lại để lấy token mới
- Check AuthInterceptor đã được register chưa

#### Issue #3: Status 401 Unauthorized

Token hết hạn hoặc invalid

**Solution:**

- Logout và login lại
- Check token expiry time

#### Issue #4: Status 0 (Network Error)

Backend không chạy hoặc wrong port

**Solution:**

- Check backend đang chạy ở port 8888
- `curl http://localhost:8888/users/profile/me -H "Authorization: Bearer <token>"`

### 5. Manual Test với CURL

```bash
# Get token from localStorage first
# Then test API:
curl -X GET "http://localhost:8888/users/profile/me" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

**Expected Response:**

```json
{
  "status": 200,
  "message": "Get profile successfully",
  "data": {
    "id": 1,
    "name": "Phong",
    "dateOfBirth": "2000-03-17",
    "gender": "MALE"
  }
}
```

### 6. Quick Checks

**In Console, run:**

```javascript
// Check token
console.log('Token:', localStorage.getItem('accessToken'));

// Check user
console.log('User:', localStorage.getItem('currentUser'));

// Manual API call
fetch('http://localhost:8888/users/profile/me', {
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  },
  credentials: 'include'
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 7. Backend Checklist

- [ ] Backend đang chạy ở port 8888
- [ ] CORS cho phép origin `http://localhost:4200`
- [ ] CORS có `allowCredentials(true)`
- [ ] Endpoint `/users/profile/me` exists
- [ ] JWT token validation hoạt động
- [ ] Token chưa hết hạn

### 8. Frontend Checklist

- [ ] User đã đăng nhập
- [ ] localStorage có `accessToken`
- [ ] AuthInterceptor đã được registered trong app module
- [ ] ProfileService endpoint đúng: `/users/profile/me`
- [ ] HttpClientModule đã được import

## Expected Console Output (Success)

```
🔍 Loading profile...
📌 Access Token: EXISTS
✅ Profile loaded successfully: {id: 1, name: "Phong", ...}
```

## Expected Console Output (Error)

```
🔍 Loading profile...
📌 Access Token: EXISTS
❌ Error loading profile: HttpErrorResponse {status: 401, ...}
Error status: 401
Error message: Phiên đăng nhập đã hết hạn
```
