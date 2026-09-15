import { z } from "zod";

export const sevaSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(150),

  code: z
    .string()
    .min(2, "Code must be at least 2 characters")
    .max(50),

  description: z
    .string()
    .optional()
    .or(z.literal("")),

  seva_type: z
    .string()
    .min(2)
    .max(50),

  amount: z
    .number()
    .min(0, "Amount cannot be negative"),

  duration_minutes: z
    .number()
    .int()
    .min(1)
    .optional()
    .nullable(),

  max_bookings: z
    .number()
    .int()
    .min(1)
    .optional()
    .nullable(),

  requires_slot: z.boolean(),

  is_online: z.boolean(),
});

export type SevaFormValues =
  z.infer<typeof sevaSchema>;
