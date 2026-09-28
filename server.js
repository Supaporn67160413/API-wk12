require("dotenv").config();

const app = require("./app");
const { connectRedis } = require("./cache");
const PORT = process.env.PORT || 3000;

// สัปดาห์ที่ 7: เชื่อมต่อ Redis ก่อนเริ่มรับคำขอ
connectRedis()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server กำลังทำงานที่พอร์ต ${PORT} (${process.env.NODE_ENV})`);
    });
  })
  .catch((err) => {
    console.error("เชื่อมต่อ Redis ไม่สำเร็จ เซิร์ฟเวอร์จะไม่เริ่มทำงาน:", err);
    process.exit(1);
  });
