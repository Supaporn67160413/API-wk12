const jwt = require("jsonwebtoken");
const { sendError } = require("../lib/http");

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  // authorization: "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return sendError(res, 401, "NO_TOKEN", "กรุณาเข้าสู่ระบบก่อนใช้งาน");
  }

  try {
    // verify ผ่าน จะได้ payload ของ user กลับมา (เช่น { id, username, role })
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return sendError(res, 401, "INVALID_TOKEN", "Token ไม่ถูกต้องหรือหมดอายุ");
  }
}

function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "NO_TOKEN", "กรุณาเข้าสู่ระบบก่อนใช้งาน");
    }
    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        "FORBIDDEN",
        "คุณไม่มีสิทธิ์เข้าถึงทรัพยากรนี้",
      );
    }
    next();
  };
}

module.exports = { authenticateToken, authorizeRole };
