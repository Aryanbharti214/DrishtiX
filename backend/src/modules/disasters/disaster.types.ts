import { z } from "zod";

export const disasterTypes = [
  "FLOOD",
  "CYCLONE",
  "FIRE",
  "EARTHQUAKE",
] as const;

export const disasterStatuses = [
  "ACTIVE",
  "MONITORING",
  "CLOSED",
] as const;

export const createDisasterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must contain at least 3 characters")
    .max(150),

  type: z.enum(disasterTypes),

  description: z
    .string()
    .trim()
    .max(5000)
    .optional(),

  regionName: z
    .string()
    .trim()
    .max(255)
    .optional(),

  startDate: z.coerce.date(),

  status: z
    .enum(disasterStatuses)
    .default("ACTIVE"),
});

export const updateDisasterSchema = createDisasterSchema
  .partial()
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field must be provided",
    }
  );

export const disasterIdSchema = z.string().uuid();

export type CreateDisasterInput =
  z.infer<typeof createDisasterSchema>;

export type UpdateDisasterInput =
  z.infer<typeof updateDisasterSchema>;