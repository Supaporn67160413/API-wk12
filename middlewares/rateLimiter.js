const rateLimit = require("express-rate-limit");

const authLimiter = rateLimit({
  // กำหนดเวลาต่อโควต้า
  windowMs: 15 * 60 * 1000,
  // จำนวนคำขอสูงสุดที่อนุญาตให้ส่งภายในกรอบเวลา
  max: process.env.NODE_ENV === "test" ? 1000 : 5,
  // ตั้งค่าให้แนบข้อมูลโควตาที่เหลือกลับไปใน Header ของ Response ด้วยชื่อ RateLimit ตามมาตรฐาน IETF draft-7
  standardHeaders: "draft-7",
  // ปิดการใช้งาน Header แจ้งโควตา
  legacyHeaders: false,
  message: {
    error: {
      code: "TOO_MANY_REQUESTS",
      message: "พยายามเข้าสู่ระบบเกินจำนวนที่กำหนด กรุณาลองใหม่อีกครั้ง",
    },
  },
});

const generalLimiter = rateLimit({
  // กำหนดเวลาต่อโควต้า
  windowMs: 60 * 1000,
  // จำนวนคำขอสูงสุดที่อนุญาตให้ส่งภายในกรอบเวลา
  max: 100,
  // ตั้งค่าให้แนบข้อมูลโควตาที่เหลือกลับไปใน Header ของ Response ด้วยชื่อ RateLimit ตามมาตรฐาน IETF draft-7
  standardHeaders: "draft-7",
  // ปิดการใช้งาน Header แจ้งโควตา
  legacyHeaders: false,
});

module.exports = { authLimiter, generalLimiter };
