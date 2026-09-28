const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const { graphqlHTTP } = require("express-graphql");
const swaggerUi = require("swagger-ui-express");
const YAML = require("js-yaml");
const fs = require("fs");
const path = require("path");

const { requireJson } = require("./lib/middleware");
const { deprecationNotice } = require("./middlewares/query-parser");
const authRouter = require("./routes/auth");
const studentsRouter = require("./routes/students");
const coursesRouter = require("./routes/courses");
const enrollments = require("./routes/enrollments");
const v2Router = require("./routes/v2");
const schema = require("./schema");
const root = require("./resolvers");

const app = express();

const openapiDocument = YAML.load(
  fs.readFileSync(path.join(__dirname, "openapi.yaml"), "utf8"),
);

// ลำดับ middleware: security header -> CORS -> logger -> body parser -> content-type guard
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  }),
);
app.use(morgan("dev"));
app.use(express.json({ limit: "10kb" }));
app.use(requireJson); // แบบฝึกหัดต่อยอดข้อ 1: บังคับ Content-Type: application/json สำหรับ POST/PUT/PATCH

app.get("/", (req, res) => {
  res.status(200).json({ message: "Student API พร้อมใช้งาน" });
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

// สัปดาห์ที่ 7 แบบฝึกหัดข้อ 3: ทุก response ของ v1 แนบ header Deprecation + Link
app.use("/api/v1", deprecationNotice);

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/students/:id/enrollments", enrollments.nested);
app.use("/api/v1/students", studentsRouter);
app.use("/api/v1/courses", coursesRouter);
app.use("/api/v1/enrollments", enrollments.flat);

// สัปดาห์ที่ 7 ขั้นตอนที่ 3.3: versioning
app.use("/api/v2", v2Router);

app.use(
  "/graphql",
  graphqlHTTP({ schema, rootValue: root, graphiql: true }),
);

// 404: ไม่พบ route (หลัง route ทั้งหมด)
app.use((req, res) => {
  res.status(404).json({
    error: { code: "ROUTE_NOT_FOUND", message: "ไม่พบเส้นทางที่ร้องขอ" },
  });
});

// Error-handling middleware แบบรวมศูนย์ (ต้องมีพารามิเตอร์ 4 ตัว)
app.use((err, req, res, next) => {
  console.error(err.stack);
  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    error: {
      code: statusCode === 500 ? "INTERNAL_SERVER_ERROR" : err.type || "ERROR",
      message:
        statusCode === 500
          ? "เกิดข้อผิดพลาดที่ไม่คาดคิดภายในระบบ"
          : err.message,
    },
  });
});

module.exports = app;
