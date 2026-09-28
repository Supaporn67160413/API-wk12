USE student_api;

DELETE FROM enrollments;
DELETE FROM students;
DELETE FROM courses;
DELETE FROM users;
ALTER TABLE students AUTO_INCREMENT = 1;
ALTER TABLE courses AUTO_INCREMENT = 1;
ALTER TABLE enrollments AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
-- ผู้ใช้ทดสอบสร้างผ่าน POST /api/v1/auth/register ในสคริปต์ทดสอบ (ไม่ seed hash ตายตัว)

INSERT INTO students (name, major, email) VALUES
  ('สมชาย ใจดี', 'วิทยาการคอมพิวเตอร์', 'somchai@example.com'),
  ('สมหญิง รักเรียน', 'เทคโนโลยีสารสนเทศ', 'somying@example.com');

INSERT INTO courses (course_name, credit, seat_available) VALUES
  ('การเขียนโปรแกรมเบื้องต้น', 3, 30),
  ('โครงสร้างข้อมูล', 3, 25);

INSERT INTO enrollments (student_id, course_id) VALUES
  (1, 1),
  (1, 2),
  (2, 2);
