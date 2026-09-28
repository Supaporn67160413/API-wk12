# URI Schema ของโปรเจกต์ student-api

จัดทำในปฏิบัติการสัปดาห์ที่ 3 และปรับปรุงให้ตรงกับโค้ดจริงในไฟล์ `routes/`

## หลักการที่ยึดถือ

- ใช้คำนามพหูพจน์เป็นชื่อ resource (`students`, `courses`, `enrollments`)
- ใช้ตัวพิมพ์เล็กและขีดกลาง ไม่ใช้ camelCase หรือ underscore ใน path
- ระบุเวอร์ชันที่ base path (`/api/v1`)
- ไม่มีคำกริยาใน URI การกระทำสื่อผ่าน HTTP Method
- ตัวเลือกการดึงข้อมูลเพิ่มเติมสื่อผ่าน query parameter (`?include=courses`) ไม่ใช่ path ย่อย
- โครงสร้าง error response เดียวกันทั้งระบบ ผ่าน `lib/http.js` -> `{ "error": { "code", "message" } }`

## students

| Method | URI                                  | คำอธิบาย                                              | Status Code ที่เป็นไปได้ |
| ------ | ------------------------------------ | ---------------------------------------------------- | ------------------------ |
| GET    | `/api/v1/students`                   | ดึงรายชื่อนิสิต — `?page= &limit= &major= &sort= &order=` + cache (Redis, TTL 60s) | 200          |
| GET    | `/api/v1/students/{id}`              | ดึงข้อมูลนิสิตรายบุคคล (รองรับ `?include=courses`)    | 200, 404                 |
| POST   | `/api/v1/students`                   | เพิ่มนิสิตใหม่ (ต้องมี name, major, email)            | 201, 400, 409            |
| PUT    | `/api/v1/students/{id}`              | แก้ไขข้อมูลนิสิตทั้งระเบียน (ส่งครบทุกฟิลด์หลัก)      | 200, 400, 404            |
| PATCH  | `/api/v1/students/{id}`              | แก้ไขข้อมูลนิสิตบางส่วน (ส่งเฉพาะฟิลด์ที่ต้องการแก้) | 200, 404                 |
| DELETE | `/api/v1/students/{id}`              | ลบนิสิต                                              | 200, 404                 |

หมายเหตุ: `409` ของ POST เกิดเมื่ออีเมลซ้ำกับที่มีอยู่แล้ว (`code: DUPLICATE_EMAIL`)

## enrollments (สัปดาห์ที่ 5: ใช้ MySQL + Transaction)

| Method | URI                                                 | คำอธิบาย                                                | Status Code ที่เป็นไปได้ |
| ------ | --------------------------------------------------- | ------------------------------------------------------ | ------------------------ |
| GET    | `/api/v1/enrollments`                               | ดึงรายการลงทะเบียนทั้งหมด                               | 200                      |
| POST   | `/api/v1/students/{id}/enrollments`                 | ลงทะเบียน (ตรวจที่นั่งว่าง -> INSERT + ลด seat ใน transaction) | 201, 404, 409            |
| POST   | `/api/v1/students/{id}/enrollments/unsafe`          | เหมือนบน แต่ไม่ใช้ transaction (แบบฝึกหัดข้อ 2 ไว้เปรียบเทียบ) | 201, 404, 409            |
| DELETE | `/api/v1/students/{id}/enrollments/{courseId}`      | ยกเลิกการลงทะเบียน (ลบ + คืน seat ใน transaction, แบบฝึกหัดข้อ 3) | 200, 404                 |

body ของ POST: `{ "courseId": 2 }`
- `404 COURSE_NOT_FOUND` เมื่อไม่มีรายวิชานั้น (rollback ก่อน INSERT)
- `409 SEAT_FULL` เมื่อ `seat_available <= 0`
- `409 ALREADY_ENROLLED` เมื่อชน `UNIQUE KEY unique_enrollment` (rollback หลัง INSERT ล้มเหลว)

## students/{id}/courses (แบบฝึกหัดสัปดาห์ที่ 5 ข้อ 1)

| Method | URI                            | คำอธิบาย                              | Status Code ที่เป็นไปได้ |
| ------ | ------------------------------ | ------------------------------------ | ------------------------ |
| GET    | `/api/v1/students/{id}/courses` | รายวิชาที่นิสิตลงทะเบียน (SQL JOIN เดียว) | 200, 404                 |

## courses (สัปดาห์ที่ 5: ใช้ตาราง MySQL — คอลัมน์ course_name, credit, seat_available)

| Method | URI                     | คำอธิบาย                | Status Code ที่เป็นไปได้ |
| ------ | ----------------------- | ---------------------- | ------------------------ |
| GET    | `/api/v1/courses`       | ดึงรายวิชาทั้งหมด       | 200                      |
| GET    | `/api/v1/courses/{id}`  | ดึงรายวิชารายตัว        | 200, 404                 |
| POST   | `/api/v1/courses`       | เพิ่มรายวิชา (`course_name`, `credit`, `seat_available?`) | 201, 400 |
| PUT    | `/api/v1/courses/{id}`  | แก้ไขรายวิชาทั้งระเบียน | 200, 400, 404            |
| DELETE | `/api/v1/courses/{id}`  | ลบรายวิชา               | 200, 404                 |

## auth (สัปดาห์ที่ 6: JWT + RBAC)

| Method | URI                              | คำอธิบาย                                         | Status Code ที่เป็นไปได้ |
| ------ | -------------------------------- | ----------------------------------------------- | ------------------------ |
| POST   | `/api/v1/auth/register`          | สมัครสมาชิก (role = student เสมอ, กัน Mass Assignment) | 201, 400, 409       |
| POST   | `/api/v1/auth/login`             | เข้าสู่ระบบ -> คืน JWT                            | 200, 400, 401            |
| GET    | `/api/v1/auth/me`                | ข้อมูลผู้ใช้ที่ล็อกอิน (ต้องมี Bearer token)     | 200, 401                 |
| PATCH  | `/api/v1/auth/change-password`   | เปลี่ยนรหัสผ่าน (ต้อง login + oldPassword ถูก, แบบฝึกหัดข้อ 1) | 200, 400, 401, 404 |

รหัสผ่าน hash ด้วย bcrypt (cost 10) ก่อนบันทึก JWT payload = `{ id, email, role }` อายุตาม `JWT_EXPIRES_IN`

### route ที่ถูกป้องกันเพิ่มในสัปดาห์ที่ 6

| Route                          | การป้องกัน                                                        |
| ------------------------------ | --------------------------------------------------------------- |
| `DELETE /api/v1/students/{id}` | `authenticateToken` + `authorizeRole("admin")` -> 401 / 403     |
| `PUT /api/v1/students/{id}`    | `authenticateToken` + object-level: แก้ได้เฉพาะ `user_id` ตรงกับตนเอง (admin ยกเว้น) -> 401 / 403 (แบบฝึกหัดข้อ 2) |

## สัปดาห์ที่ 7: Caching, Pagination, Versioning

- `GET /api/v1/students` และ `GET /api/v1/courses` มีชั้น cache Redis
  - students: cache key รวมพารามิเตอร์ `students:list:page=..:limit=..:major=..:sort=..:order=..` TTL 60s (แบบฝึกหัดข้อ 2)
  - courses: key เดียว `courses:all` TTL 300s (แบบฝึกหัดข้อ 1)
  - `message` บอกแหล่ง: `"สำเร็จ (จาก cache)"` / `"สำเร็จ (จากฐานข้อมูล)"`
  - POST/PUT/PATCH/DELETE ล้าง cache ที่เกี่ยวข้อง
- `GET /api/v1/students` รองรับ `page`, `limit` (สูงสุด 100), `major`, `sort` (allowlist: id/name/major/created_at), `order` (asc/desc) — response มี `pagination: { page, limit, total, totalPages }`
- `sort` ที่ไม่อยู่ใน allowlist (รวม SQL injection) จะ fallback เป็น `id` ไม่ error
- **v2**: `GET /api/v2/students` — โครงสร้าง response ต่างจาก v1 (`{ items, count, meta }` ไม่มี wrapper `message`/`data`)
- ทุก response ของ `/api/v1/*` มี header `Deprecation: @1735689600` และ `Link: </api/v2/students>; rel="successor-version"` (แบบฝึกหัดข้อ 3, RFC 9745) — `/api/v2/*` ไม่มี

## GraphQL (สัปดาห์ที่ 2)

| Method | URI          | คำอธิบาย                                  |
| ------ | ------------ | ---------------------------------------- |
| POST   | `/graphql`   | endpoint เดียวสำหรับทุก query และ mutation |
| GET    | `/graphql`   | หน้าเครื่องมือ GraphiQL (`graphiql: true`) |

## การเปลี่ยนแปลงจากสัปดาห์ก่อน

| เดิม                            | ปรับเป็น                                | เหตุผล                                       |
| ------------------------------ | -------------------------------------- | ------------------------------------------- |
| `GET /api/v1/students/{id}/full` | `GET /api/v1/students/{id}?include=courses` | `full` ไม่ใช่คำนามที่สื่อถึง resource        |
| POST อีเมลซ้ำ ตอบ `400`        | ตอบ `409 Conflict`                     | ความขัดแย้งกับสถานะปัจจุบันของ resource ควรเป็น 409 |
| ไม่มี PATCH                    | เพิ่ม `PATCH /api/v1/students/{id}`     | รองรับการแก้ไขบางฟิลด์โดยไม่ต้องส่งข้อมูลครบ  |
| error เขียน `res.status().json()` กระจาย | รวมผ่าน `sendError()` ใน `lib/http.js` | โครงสร้าง error เดียวกันทั้งระบบ             |
| ข้อมูล in-memory array (`lib/data.js`)  | ตาราง MySQL ผ่าน connection pool (`db.js`) | ข้อมูลถาวร รองรับ constraint, FK, transaction (สัปดาห์ที่ 5) |
| enrollments เก็บใน `student.courseIds`  | ตาราง `enrollments` + `ON DELETE CASCADE` + `UNIQUE KEY` | integrity บังคับที่ระดับฐานข้อมูล            |
