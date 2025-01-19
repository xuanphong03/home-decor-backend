# NestJS:

- nest g resource "name"
- npm i cookie-parser: thư viện hỗ trợ cookie
- npm i --save-dev @types/cookie-parser: thư viện hỗ trợ cookie cho ts (cài cả 2)
- npm i @nestjs/config (hỗ trợ đọc env)
- npm install @prisma/client : Thư viện thao tác với prisma
  npx prisma init --datasource-provider postgresql
  npx prisma migrate reset
  npx prisma migrate dev --name "init db"

# Generat key

openssl rand -hex 32

# Băm password

npm i bcrypt
npm i -D @types/bcrypt

# Logic xác thực (Login - Authentication)

- Lấy body: Email, Password
- Tìm Email có tồn tại trong bảng users không? ---> Không tồn tại thông báo lỗi
- Lấy password hash từ database
- Verify password hash vói password từ body ---> Failed ---> Thông báo lỗi
  ---> Success ---> Lưu user_id hoặc email vào Jwt (dùng thư viện jsonwebtoken)
  ---> Trả về response token tương ứng

# Authorization

- Gửi request header: Authorization: Bearer token-can-gui
- Server đọc header Authorization và cắt ra token
- Kiểm tra token có làm trong blacklist không ? (blacklist chứa các token sau khi người dùng logout) lấy từ database hoặc redis
- Verify token (Dùng thư viện jsonwebtoken) ---> Trả về được thông tin trong token (user_id hoặc email)
- Dùng dữ liệu từ token để lấy thông tin trong database
- Trả về response

## Logout

- Gửi request chứa token lên server
- Verify token
- Thêm token vào blacklist
- Trả về response

## Đăng ký

- cần xác thực email
- trong bảng user có thêm cột verify (nên lưu là DateTime ko nên đặt là boolean)

## Xác minh 2 bước

## Đăng nhập mạng xã hội

## Quên mật khẩu

## Đổi mật khẩu --> Đăng xuất khỏi tất cả các thiết bị

## Liên kết với phần xác thực của thiết bị

## Permission System

GET /roles -> Lấy danh sách roles

POST /roles -> Thêm roles mới
Options: Thêm permission vào role, nếu permission không tồn tại tự động tạo permission

PATCH /roles/:id -> Sửa role
Options: Cập nhật lại dũ liệu bảng trung gian roles_permissions

DELETE /roles/:id -> Xóa role (Xóa dữ liệu cả bảng trung gian)

POST /roles/:id/copy -> Copy role cũ sang role mới (Lưu ở bản nháp)

### Users

GET /users/:id/roles -> Danh sách roles theo userId

PUT /users/:id/roles -> Cập nhật role cho 1 user (Thêm mới, Sửa lại)

DELETE /users/:id/roles -> Xóa tất cả role của 1 user

PUT /users/:id/permission -> Thiết lập quyền riêng cho 1 user

DELETE /users/:id/permission -> Xóa hết quyền riêng của 1 user

### Lấy tất cả Permissions của 1 user

- Lấy permission của role được gán vào user
- Lấy permission được gán trực tiếp vào user
  ==> Lọc trùng
