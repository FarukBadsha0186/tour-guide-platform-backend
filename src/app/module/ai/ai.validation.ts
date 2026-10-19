import z from "zod"

export const chatValidationSchema = z.object({
  message: z
    .string()
    .trim()
    .min(2, "Message must be at least 2 characters")
    .max(500, "Message too long (max 500 characters)")
    .refine(
      (val) => !/<\s*script/i.test(val),
      "Invalid characters detected"
    ),
})