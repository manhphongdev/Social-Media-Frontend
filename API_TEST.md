# Test Authentication APIs

## 1. Register API

### PowerShell Command

```powershell
$body = @{
    name = "Nguyễn Văn A"
    email = "testuser@fpt.edu.vn"
    password = "password123"
    confirmPassword = "password123"
    gender = "MALE"
    dateOfBirth = "2000-01-15"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8888/auth/register" `
  -Method POST `
  -Headers @{
    "accept" = "*/*"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

### Curl Command (Bash)

```bash
curl -X 'POST' \
  'http://localhost:8888/auth/register' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "Nguyễn Văn A",
  "email": "testuser@fpt.edu.vn",
  "password": "password123",
  "confirmPassword": "password123",
  "gender": "MALE",
  "dateOfBirth": "2000-01-15"
}'
```

### Register Requirements

#### Email

- Phải có định dạng email hợp lệ
- Ví dụ: `phongtmhe182382@fpt.edu.vn`

#### Password

- Độ dài: 8-20 ký tự
- Không có yêu cầu đặc biệt khác

#### Age (từ dateOfBirth)

- Tuổi phải từ 12-100
- Tính từ ngày sinh đến hiện tại

#### Gender

- Enum: `MALE`, `FEMALE`, `OTHER`
- Phải viết HOA

#### Các trường bắt buộc

- name
- email
- password
- confirmPassword
- gender
- dateOfBirth

### Expected Success Response

```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "testuser@fpt.edu.vn",
    "gender": "MALE",
    "dateOfBirth": "2000-01-15",
    "createdAt": "2026-02-05T13:20:00.000Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 2. Login API

### PowerShell Command

```powershell
$body = @{
    email = "testuser@fpt.edu.vn"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8888/auth/login" `
  -Method POST `
  -Headers @{
    "accept" = "*/*"
    "Content-Type" = "application/json"
  } `
  -Body $body
```

### Curl Command (Bash)

```bash
curl -X 'POST' \
  'http://localhost:8888/auth/login' \
  -H 'accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "email": "testuser@fpt.edu.vn",
  "password": "password123"
}'
```

### Login Requirements

#### Email

- Phải có định dạng email hợp lệ
- Tài khoản phải tồn tại trong hệ thống

#### Password

- Độ dài: 8-20 ký tự
- Phải khớp với password đã đăng ký

#### Các trường bắt buộc

- email
- password

### Expected Success Response

```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Nguyễn Văn A",
    "email": "testuser@fpt.edu.vn",
    "gender": "MALE",
    "dateOfBirth": "2000-01-15"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Expected Error Responses

#### 401 Unauthorized (Wrong password)

```json
{
  "code": 1005,
  "message": "Invalid credentials",
  "timestamp": "2026-02-05T13:25:00.000Z",
  "path": "/auth/login"
}
```

#### 404 Not Found (User doesn't exist)

```json
{
  "code": 1004,
  "message": "User not found",
  "timestamp": "2026-02-05T13:25:00.000Z",
  "path": "/auth/login"
}
```

