const axios = require("axios");

// เป็นการตรวจสอบเวลาที่ยิง API ไปหาเซิร์ฟเวอร์อื่น
function isRetryable(error) {
  // ถ้า Error ไม่มีการตอบกลับใดๆ จากปลายทางเลย สามารถยิงซ้ำได้เลย
  if (!error.response) return true;
  // แต่หากมีจะทำการ ดึงตัวแปร status ออกมาเก็บไว้ในตัวแปร status เพื่อตรวจสอบ
  const status = error.response.status;
  // ทำการตรวจสอบ status ว่าเป็นหมายเลข 429, 500 - 599 ไหม
  // หากเป็นจะทำการยิง API ใหม่
  return status === 429 || (status >= 500 && status < 600);
  // ทำไมยอมแค่กลุ่มนี้ เพราะ
  // 429 คือการบอกว่ายิงมาถี่จนเกินไป ให้รอสักครู่และยิงใหม่
  // 500 - 599 คือการบอกว่าระบบปลายทางพัง รอแก้ไขแล้วค่อยยิงมาใหม่
}

// ฟังก์ชันนาฬิกาจับเวลา หรือ ฟังก์ชันหยุดรอ
// ms คือ มิลลิวินาที เช่น ถ้าส่งเลข 2000 เข้ามา ก็คือ 2 วินาที
function delay(ms) {
  // คืนค่าเป็น Promise ซึ่งเป็นเทคนิคที่ทำให้สามารถนำ await ไปวางดักหน้ามันได้
  // เพื่อให้โค้ดบรรทัดต่อไปหยุดรอจนกว่าสัญญาจะสำเร็จ
  // ซึ่งพอครบเวลาจะใช้ฟังก์ชัน resolve
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// async คือ การบอกว่าฟังก์ชันนี้จะทำอะไรบางอย่างที่ต้องใช้เวลารอ
// ซึ่งมี Parameter คือ
// 1.URL คือ ลิงก์ที่อยู่ของเซิร์ฟเวอร์ปลายทาง
// 2.Timeout คือ เวลาที่สามารถรอได้ เปรียบเสมือนขีดจำกัดการรอ
//    ซึ่งในที่นี้สามารถรอได้ 3000 ms หรือ 3 วินาที
// 3.MaxRetries เป็นการกำหนดโควต้าในการยิงซ้ำ หากยิงไปครั้งแรกแล้วพัง จะยอมให้ยิงซ้ำอีกรอบ
async function fetchWithRetry(url, timeoutMs = 3000, maxRetries = 2) {
  // เป็นตัวแปรที่เก็บค่าจำนวนครั้งที่ยิงไป
  let attempt = 0;

  while (true) {
    try {
      // ทำการดึง API
      const response = await axios.get(url, { timeout: timeoutMs });
      // หากดึงได้จะทำการส่งข้อมูลกลับ
      return response.data;
    } catch (error) {
      // เพิ่มค่าการยิงซ้ำ +1
      attempt += 1;
      // เก็บค่าว่าสามารยิงซ้ำได้ไหม โดยต้องเข้าเงื่อนไข
      // เงื่อนไข คือ ค่า attempt ต้องน้อยกว่า maxRetries
      // และ error เป็นสถานะที่ไม่มี response หรืออยู่ในกลุ่ม 500 - 599
      // หากเข้าเงื่อนไขทั้งสองอย่างตัวแปรจะเป็น true
      const canRetry = attempt <= maxRetries && isRetryable(error);

      // หากไม่เข้าเงื่อนไขจะเป็น false
      // ซึ่งหากเป็น false จะทำการโยน error ออกไป
      if (!canRetry) {
        throw error;
      }

      // เป็นการตั้งค่าเวลาที่จะดึงใหม่อีกครั้ง
      // หากเป็นการยิงซ้ำครั้งที่ 1 จะได้
      // 2^(1 - 1) * 1000
      // 2^0 * 1000
      //   1 * 1000
      //   1000 (จะทำการยิงซ้ำอีกทีเมื่อผ่านไป 1000 ms หรือ 1 วินาที)
      // หากเป้นการยิงซ้ำครั้งที่ 2 หรือครั้งสุดท้ายที่เราตั้งขีดจำกัดโควต้าการยิงไว้ในปัจจุบัน จะได้
      // 2^(2 - 1) * 1000
      // 2^1 * 1000
      //   2 * 1000
      //   2 * 1000
      //   2000 (จะทำการยิงซ้ำอีกทีเมื่อเวลาผ่านไป 2000 ms หรือ 2 วินาที)
      const baseBackoffMs = 2 ** (attempt - 1) * 1000;
      console.warn(
        `[external-api] request to ${url} failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying in ${Math.round(baseBackoffMs)} ms`,
      );
      await delay(baseBackoffMs);
    }
  }
}

module.exports = { fetchWithRetry, isRetryable };
