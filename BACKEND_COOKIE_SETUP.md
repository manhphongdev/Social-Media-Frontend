# Hướng dẫn cấu hình Backend để lưu RefreshToken vào Cookie

## ✅ Frontend đã cấu hình sẵn

Frontend (Angular) đã được cấu hình để **nhận và gửi cookies** với mọi HTTP request:
- ✅ `withCredentials: true` trong tất cả requests
- ✅ HTTP Interceptor tự động thêm credentials
- ✅ Cookies sẽ được browser tự động lưu và gửi kèm

## 🔧 Yêu cầu cấu hình cho Backend (Spring Boot)

### 1. **CORS Configuration** - Quan trọng nhất!

Backend phải cho phép credentials trong CORS config:

```java
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins("http://localhost:4200")  // Frontend URL
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)  // ⭐ BẮT BUỘC để cookies hoạt động
                .maxAge(3600);
    }
}
```

**⚠️ LƯU Ý:** 
- Khi dùng `allowCredentials(true)`, **KHÔNG ĐƯỢC** dùng `allowedOrigins("*")`
- Phải chỉ định cụ thể origin: `"http://localhost:4200"`

### 2. **Set RefreshToken Cookie trong Response**

Khi login/register thành công, backend cần set cookie:

```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
    // 1. Authenticate user
    AuthResponse authResponse = authService.login(request);
    
    // 2. Set refreshToken as HttpOnly cookie
    Cookie refreshTokenCookie = new Cookie("refreshToken", authResponse.getRefreshToken());
    refreshTokenCookie.setHttpOnly(true);   // ⭐ Bảo mật: JS không đọc được
    refreshTokenCookie.setSecure(false);     // true nếu dùng HTTPS
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setMaxAge(7 * 24 * 60 * 60); // 7 days
    refreshTokenCookie.setDomain("localhost"); // hoặc null cho localhost
    // refreshTokenCookie.setSameSite("Lax");  // Spring Boot 6+ only
    
    response.addCookie(refreshTokenCookie);
    
    // 3. Return accessToken trong response body
    return ResponseEntity.ok(authResponse);
}
```

### 3. **Response Structure** (như hiện tại - OK rồi!)

```json
{
  "status": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ0eXAiOi...",
    "authenticate": true
  }
}
```

**Lưu ý:** 
- `accessToken` trả trong response body (frontend sẽ lưu localStorage)
- `refreshToken` được set vào cookie (HttpOnly, secure)

### 4. **Read RefreshToken from Cookie**

Khi cần dùng refreshToken (ví dụ refresh access token):

```java
@PostMapping("/refresh")
public ResponseEntity<?> refreshToken(
    @CookieValue(name = "refreshToken", required = false) String refreshToken,
    HttpServletResponse response
) {
    if (refreshToken == null) {
        throw new UnauthorizedException("Refresh token not found");
    }
    
    // Validate và tạo accessToken mới
    String newAccessToken = authService.refreshAccessToken(refreshToken);
    
    // Có thể tạo refreshToken mới và set cookie lại
    // ... (tùy chiến lược)
    
    return ResponseEntity.ok(Map.of(
        "accessToken", newAccessToken,
        "authenticate", true
    ));
}
```

### 5. **Logout - Clear Cookie**

```java
@PostMapping("/logout")
public ResponseEntity<?> logout(HttpServletResponse response) {
    // Clear refreshToken cookie
    Cookie refreshTokenCookie = new Cookie("refreshToken", null);
    refreshTokenCookie.setHttpOnly(true);
    refreshTokenCookie.setSecure(false);
    refreshTokenCookie.setPath("/");
    refreshTokenCookie.setMaxAge(0); // ⭐ Set 0 để xóa cookie
    
    response.addCookie(refreshTokenCookie);
    
    return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
}
```

## 🧪 Cách kiểm tra

### 1. **Chrome DevTools**
1. Mở DevTools (F12)
2. Tab **Application** > **Cookies** > `http://localhost:4200`
3. Sau khi login, phải thấy cookie `refreshToken`

### 2. **Network Tab**
1. Tab **Network**
2. Click vào request `/auth/login`
3. Tab **Headers** > **Response Headers**
4. Phải thấy: `Set-Cookie: refreshToken=...`

### 3. **Subsequent Requests**
1. Mọi request sau đó (từ Angular) sẽ tự động gửi kèm cookie
2. Tab **Network** > Click request bất kỳ
3. Tab **Headers** > **Request Headers**
4. Phải thấy: `Cookie: refreshToken=...`

## ❌ Các lỗi thường gặp

### Lỗi 1: CORS Error
```
Access to XMLHttpRequest at 'http://localhost:8888/auth/login' from origin 
'http://localhost:4200' has been blocked by CORS policy: 
The value of the 'Access-Control-Allow-Credentials' header in the response is '' 
which must be 'true' when the request's credentials mode is 'include'.
```

**Giải pháp:** 
- Set `allowCredentials(true)` trong CORS config
- **KHÔNG dùng** `allowedOrigins("*")`

### Lỗi 2: Cookie không được set
**Nguyên nhân:**
- Backend không call `response.addCookie()`
- Cookie attributes không đúng (domain, path)
- SameSite policy blocking

**Giải pháp:**
- Check response headers xem có `Set-Cookie` không
- Set `SameSite=Lax` hoặc `None` (nếu cross-site)
- Nếu `SameSite=None` thì bắt buộc `Secure=true` (HTTPS)

### Lỗi 3: Cookie bị xóa sau khi close browser
**Nguyên nhân:** MaxAge không được set

**Giải pháp:** Set `setMaxAge(seconds)` cho cookie

## 📋 Checklist cho Backend Developer

- [ ] CORS config có `allowCredentials(true)`
- [ ] CORS config chỉ định cụ thể origin (không dùng "*")
- [ ] Login endpoint set `refreshToken` cookie
- [ ] Cookie có `HttpOnly=true` (bảo mật)
- [ ] Cookie có `MaxAge` phù hợp (ví dụ: 7 days)
- [ ] Cookie có `Path="/"` 
- [ ] Refresh endpoint đọc cookie và validate
- [ ] Logout endpoint clear cookie bằng `setMaxAge(0)`
- [ ] Test bằng DevTools thấy cookie được set

## 🎯 Kết quả mong đợi

Sau khi cấu hình đúng:
1. ✅ User login → Cookie `refreshToken` được set
2. ✅ Mọi request API sau đó tự động gửi kèm cookie
3. ✅ Backend đọc được refreshToken từ cookie
4. ✅ Token hết hạn → Frontend call `/auth/refresh` → Nhận accessToken mới
5. ✅ User logout → Cookie bị xóa
