# Debug Guide - Notification Loading Issue

## Vấn đề

Trang thông báo bị treo ở trạng thái "Đang tải thông báo..."

## Backend đã được gọi

✅ Backend API đã được gọi thành công

## Các bước debug

### 1. Kiểm tra Console Log

Mở Developer Tools (F12) và kiểm tra:

**Console Tab:**

- Tìm log: `"Notifications response:"` - Xem response từ API
- Tìm log: `"Loaded X notifications"` - Xem số lượng notifications
- Tìm log: `"Error fetching notifications:"` - Xem lỗi nếu có
- Kiểm tra có lỗi màu đỏ không

**Network Tab:**

- Tìm request đến `/notifications?limit=20`
- Kiểm tra Status Code (nên là 200)
- Xem Response data
- Kiểm tra Request Headers có `Authorization: Bearer ...` không

### 2. Kiểm tra Response Structure

Response từ backend nên có cấu trúc:

```json
{
  "status": 200,
  "message": "...",
  "data": {
    "content": [...],
    "nextCursor": null,
    "hasNext": false
  }
}
```

### 3. Các nguyên nhân có thể

#### A. Response structure không đúng

- Backend trả về structure khác
- Field `data` không tồn tại
- Field `content` không phải array

**Giải pháp:** Kiểm tra response trong Network tab

#### B. CORS Error

- Browser block request
- Thấy lỗi CORS trong console

**Giải pháp:** Backend cần config CORS cho phép origin `http://localhost:4200`

#### C. Authentication Error

- Token không hợp lệ hoặc hết hạn
- Status code 401 hoặc 403

**Giải pháp:** Đăng nhập lại để lấy token mới

#### D. Timeout

- Request mất quá 10 giây
- Thấy timeout error

**Giải pháp:** Kiểm tra backend có chạy không

### 4. Quick Fix - Test với Mock Data

Nếu muốn test UI trước, tạm thời comment API call và dùng mock data:

```typescript
// In notifications.component.ts, method loadNotifications()
loadNotifications(cursor?: string): void {
  this.loading = true;
  this.error = null;

  // TEMPORARY: Use mock data
  setTimeout(() => {
    this.notifications = [
      {
        id: 1,
        text: "Test notification 1",
        type: "REACTION" as any,
        targetType: "POST" as any,
        targetId: 1,
        isRead: false,
        fromUser: {
          id: 1,
          name: "Test User",
          username: "testuser"
        },
        createdAt: new Date().toISOString()
      }
    ];
    this.loading = false;
  }, 500);

  // Comment out the real API call temporarily
  // const sub = this.notificationService.getNotifications...
}
```

### 5. Kiểm tra Service Error Handling

Service đã có `catchError` nên sẽ không throw error. Nếu có lỗi, nó sẽ return empty array:

```typescript
catchError(error => {
  console.error('Error fetching notifications:', error);
  return of({ content: [], nextCursor: null, hasNext: false });
})
```

Điều này có nghĩa là:

- Nếu có lỗi → return empty array → loading = false → hiển thị "Không có thông báo"
- Nếu treo → có thể request chưa complete hoặc error

### 6. Test API trực tiếp

Dùng Postman hoặc curl để test:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8888/notifications?limit=20
```

## Checklist Debug

- [ ] Mở Developer Tools Console
- [ ] Refresh trang notifications
- [ ] Kiểm tra console logs
- [ ] Kiểm tra Network tab
- [ ] Xem response data
- [ ] Kiểm tra có lỗi CORS không
- [ ] Kiểm tra status code
- [ ] Kiểm tra Authorization header
- [ ] Test API với Postman/curl

## Thông tin cần cung cấp

Để giúp debug tốt hơn, cung cấp:

1. Screenshot console logs
2. Screenshot Network tab (request/response)
3. Status code của request
4. Response body từ backend
5. Có lỗi màu đỏ trong console không?
