const { buildSchema } = require("graphql");

// ปฏิบัติการสัปดาห์ที่ 2 ส่วนที่ 4 + แบบฝึกหัดต่อยอดข้อ 3 (Instructor) และข้อ 5 (hasCourse)
const schema = buildSchema(`
  type Instructor {
    id: ID!
    name: String!
    courses: [Course!]!
  }

  type Course {
    id: ID!
    courseName: String!
    credit: Int!
    instructor: Instructor
  }

  type Student {
    id: ID!
    name: String!
    major: String!
    email: String!
    phone: String!
    courses: [Course!]!
  }

  type Query {
    student(id: ID!): Student
    students(major: String, sortBy: String, hasCourse: ID): [Student!]!
    studentCount: Int!
    course(id: ID!): Course
    courses(minCredit: Int): [Course!]!
    searchStudents(keyword: String!): [Student!]!
    instructors: [Instructor!]!
  }

  input CreateStudentInput {
    name: String!
    major: String!
    email: String!
    phone: String!
    courseIds: [ID!]
  }

  input UpdateStudentInput {
    name: String
    major: String
    email: String
    phone: String
    courseIds: [ID!]
  }

  type DeleteResult {
    success: Boolean!
    message: String!
  }

  type Mutation {
    createStudent(input: CreateStudentInput!): Student!
    updateStudent(id: ID!, input: UpdateStudentInput!): Student
    deleteStudent(id: ID!): DeleteResult!
  }
`);

module.exports = schema;
