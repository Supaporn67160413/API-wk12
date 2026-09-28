function parsePagination(req, res, next) {
  req.pagination = {
    page: Math.max(1, parseInt(req.query.page) || 1),
    limit: Math.min(100, parseInt(req.query.limit) || 10),
  };
  req.pagination.offset = (req.pagination.page - 1) * req.pagination.limit;
  next();
}

// "id" เป็นค่า default จึงต้องอยู่ใน allowlist ด้วย
const ALLOWED_SORT_FIELDS = ["id", "name", "major", "created_at"];

function parseSort(req, res, next) {
  req.sort = {
    field: ALLOWED_SORT_FIELDS.includes(req.query.sort) ? req.query.sort : "id",
    order: req.query.order === "desc" ? "DESC" : "ASC",
  };
  next();
}

// แบบฝึกหัดต่อยอดสัปดาห์ที่ 7 ข้อ 3: แจ้ง client ว่า v1 กำลังจะเลิกใช้ (RFC 9745)
// ค่า Deprecation เป็น Unix timestamp นำหน้าด้วย @ (ตัวอย่าง: 2025-01-01 00:00:00 UTC)
const DEPRECATION_DATE = "@1735689600";

function deprecationNotice(req, res, next) {
  res.set("Deprecation", DEPRECATION_DATE);
  res.set("Link", '</api/v2/students>; rel="successor-version"');
  next();
}

module.exports = { parsePagination, parseSort, deprecationNotice };
