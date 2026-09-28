// ข้อมูลจำลองของ GraphQL แยกจากฝั่ง REST ในปฏิบัติการนี้ (สัปดาห์ที่ 2)
let students = [
  {
    id: 1,
    name: "สมชาย ใจดี",
    major: "วิทยาการคอมพิวเตอร์",
    email: "somchai@example.com",
    phone: "080-000-0001",
    courseIds: [101, 102],
  },
  {
    id: 2,
    name: "สมหญิง รักเรียน",
    major: "เทคโนโลยีสารสนเทศ",
    email: "somying@example.com",
    phone: "080-000-0002",
    courseIds: [102],
  },
];

let courses = [
  { id: 101, courseName: "การเขียนโปรแกรมเบื้องต้น", credit: 3, instructorId: 201 },
  { id: 102, courseName: "โครงสร้างข้อมูล", credit: 3, instructorId: 202 },
];

// แบบฝึกหัดต่อยอดข้อ 3: อาจารย์ผู้สอน (หนึ่งคนสอนได้หลายวิชา)
let instructors = [
  { id: 201, name: "ผศ.ดร.วิทยา สอนดี" },
  { id: 202, name: "อ.ปัญญา ตั้งมั่น" },
];

let nextStudentId = 3;

function resolveInstructor(instructor) {
  if (!instructor) return null;
  return {
    ...instructor,
    courses: () =>
      courses
        .filter((c) => c.instructorId === instructor.id)
        .map(resolveCourse),
  };
}

function resolveCourse(course) {
  return {
    ...course,
    instructor: () =>
      resolveInstructor(
        instructors.find((i) => i.id === course.instructorId),
      ),
  };
}

function resolveStudent(student) {
  return {
    ...student,
    courses: courses
      .filter((c) => student.courseIds.includes(c.id))
      .map(resolveCourse),
  };
}

const root = {
  // ----- Read -----
  student: ({ id }) => {
    const student = students.find((s) => s.id === Number(id));
    return student ? resolveStudent(student) : null;
  },

  students: ({ major, sortBy, hasCourse }) => {
    let result = students;

    if (major) {
      result = result.filter((s) => s.major === major);
    }

    // แบบฝึกหัดต่อยอดข้อ 5
    if (hasCourse !== undefined && hasCourse !== null) {
      const courseId = Number(hasCourse);
      result = result.filter((s) => s.courseIds.includes(courseId));
    }

    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result.map(resolveStudent);
  },

  studentCount: () => students.length,

  course: ({ id }) => {
    const course = courses.find((c) => c.id === Number(id));
    return course ? resolveCourse(course) : null;
  },

  courses: ({ minCredit }) => {
    const list =
      minCredit === undefined || minCredit === null
        ? courses
        : courses.filter((c) => c.credit >= minCredit);
    return list.map(resolveCourse);
  },

  searchStudents: ({ keyword }) => {
    const lowerKeyword = keyword.toLowerCase();
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(lowerKeyword) ||
          s.major.toLowerCase().includes(lowerKeyword),
      )
      .map(resolveStudent);
  },

  instructors: () => instructors.map(resolveInstructor),

  // ----- Create -----
  createStudent: ({ input }) => {
    const newStudent = {
      id: nextStudentId++,
      name: input.name,
      major: input.major,
      email: input.email,
      phone: input.phone,
      courseIds: (input.courseIds || []).map(Number),
    };
    students.push(newStudent);
    return resolveStudent(newStudent);
  },

  // ----- Update -----
  updateStudent: ({ id, input }) => {
    const student = students.find((s) => s.id === Number(id));
    if (!student) return null;

    if (input.name !== undefined) student.name = input.name;
    if (input.major !== undefined) student.major = input.major;
    if (input.email !== undefined) student.email = input.email;
    if (input.phone !== undefined) student.phone = input.phone;
    if (input.courseIds !== undefined) {
      student.courseIds = input.courseIds.map(Number);
    }

    return resolveStudent(student);
  },

  // ----- Delete -----
  deleteStudent: ({ id }) => {
    const index = students.findIndex((s) => s.id === Number(id));
    if (index === -1) {
      return { success: false, message: "ไม่พบข้อมูลนิสิตที่ต้องการลบ" };
    }
    students.splice(index, 1);
    return { success: true, message: "ลบข้อมูลนิสิตสำเร็จ" };
  },
};

module.exports = root;
