const request = require("supertest");
const app = require("./app");
const pool = require("./db");

async function registerAndLogin(email, password = "Passw0rd!") {
  await request(app).post("/api/v1/auth/register").send({ email, password });
  const loginResponse = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
  return loginResponse.body.token;
}

afterAll(async () => {
  await pool.end();
});

describe("GET /api/v1/students", () => {
  test("ควรคืน 200 พร้อมรายการนิสิตและ pagination", async () => {
    const response = await request(app).get("/api/v1/students");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.pagination).toHaveProperty("total");
  });
});

describe("POST /api/v1/students", () => {
  test("ควรคืน 201 เมื่อข้อมูลถูกต้องและครบถ้วน", async () => {
    // 1. จำลองการล็อกอินเพื่อเอา Token
    const adminEmail = `adminpost${Date.now()}@example.com`;
    const token = await registerAndLogin(adminEmail);
    const uniqueEmail = `student${Date.now()}@example.com`;

    const response = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${token}`) // 2. แนบ Token ไปด้วย
      .send({
        name: "ทดสอบ ระบบ",
        major: "วิศวกรรมซอฟต์แวร์",
        email: uniqueEmail,
        // 3. เพิ่มฟิลด์ตามที่ Zod Schema ของอาจารย์ต้องการ
        age: 20,
        studentType: "local",
        nationalId: "1349900000000",
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.email).toBe(uniqueEmail);
  });

  test("ควรคืน 400 เมื่อไม่ระบุ major", async () => {
    // ต้องแนบ Token ให้ผ่าน Auth ไปให้ถึงด่าน Zod Validation ด้วย
    const adminEmail = `adminpost2${Date.now()}@example.com`;
    const token = await registerAndLogin(adminEmail);

    const response = await request(app)
      .post("/api/v1/students")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "ทดสอบ ไม่ครบ",
        email: `incomplete${Date.now()}@example.com`,
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
  });
});

describe("PUT /api/v1/students/:id", () => {
  test("ควรคืน 200 เมื่อเจ้าของระเบียนแก้ไขข้อมูลของตนเอง", async () => {
    const email = `owner${Date.now()}@example.com`;
    const token = await registerAndLogin(email);

    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    const userId = rows[0].id;

    const [result] = await pool.query(
      "INSERT INTO students (name, major, email, user_id) VALUES (?, ?, ?, ?)",
      [
        "เจ้าของ ระเบียน",
        "เทคโนโลยีสารสนเทศ",
        `owned${Date.now()}@example.com`,
        userId,
      ],
    );
    const studentId = result.insertId;

    const response = await request(app)
      .put(`/api/v1/students/${studentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "แก้ไขแล้ว",
        major: "เทคโนโลยีสารสนเทศ",
        email: `updated${Date.now()}@example.com`,
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("แก้ไขแล้ว");
  });

  test("ควรคืน 403 เมื่อแก้ไขระเบียนของผู้อื่นโดยไม่ใช่ admin", async () => {
    const token = await registerAndLogin(`other${Date.now()}@example.com`);

    const [result] = await pool.query(
      "INSERT INTO students (name, major, email) VALUES (?, ?, ?)",
      [
        "ไม่มีเจ้าของ",
        "วิทยาการคอมพิวเตอร์",
        `noowner${Date.now()}@example.com`,
      ],
    );
    const studentId = result.insertId;

    const response = await request(app)
      .put(`/api/v1/students/${studentId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "พยายามแก้ไข",
        major: "วิทยาการคอมพิวเตอร์",
        email: `hacked${Date.now()}@example.com`,
      });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });

  test("ควรคืน 404 เมื่อ id ไม่มีอยู่จริง", async () => {
    const token = await registerAndLogin(`notfound${Date.now()}@example.com`);

    const response = await request(app)
      .put("/api/v1/students/9999999")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "ไม่มีจริง",
        major: "ไม่มีจริง",
        email: `ghost${Date.now()}@example.com`,
      });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});

describe("DELETE /api/v1/students/:id", () => {
  test("ควรคืน 200 เมื่อ admin ลบข้อมูลสำเร็จ", async () => {
    const email = `admin${Date.now()}@example.com`;
    await registerAndLogin(email);
    await pool.query("UPDATE users SET role = 'admin' WHERE email = ?", [
      email,
    ]);
    const loginResponse = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "Passw0rd!" });
    const adminToken = loginResponse.body.token;

    const [result] = await pool.query(
      "INSERT INTO students (name, major, email) VALUES (?, ?, ?)",
      ["จะถูกลบ", "วิทยาการคอมพิวเตอร์", `todelete${Date.now()}@example.com`],
    );
    const studentId = result.insertId;

    const response = await request(app)
      .delete(`/api/v1/students/${studentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
  });

  test("ควรคืน 403 เมื่อไม่ใช่ admin", async () => {
    const token = await registerAndLogin(`notadmin${Date.now()}@example.com`);

    const response = await request(app)
      .delete("/api/v1/students/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe("FORBIDDEN");
  });
});
