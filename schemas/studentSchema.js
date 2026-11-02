const { z } = require("zod");

const createStudentSchema = z
  .object({
    name: z.string().min(1).max(100),
    email: z.email(),
    major: z.string().optional(),
    age: z.number().int().min(15).max(80).optional(),
    studentType: z.enum(["local", "international"]),
    passportNumber: z.string().optional(),
    nationalId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.studentType === "international" && !data.passportNumber) {
      ctx.addIssue({
        code: "custom",
        message: "ต้องระบุ passportNumber สำหรับนิสิตต่างชาติ",
        path: ["passportNumber"],
      });
    }
    if (data.studentType === "local" && !data.nationalId) {
      ctx.addIssue({
        code: "custom",
        message: "ต้องระบุ nationalId สำหรับนิสิตไทย",
        path: ["nationalId"],
      });
    }
  });

module.exports = { createStudentSchema };
