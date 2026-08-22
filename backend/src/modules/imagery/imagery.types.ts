import { z } from "zod";

export const imagerySourceTypes = [
  "SATELLITE",
  "DRONE",
  "STREET",
] as const;

export const processingStatuses = [
  "UPLOADED",
  "QUEUED",
  "PROCESSING",
  "ANALYZED",
  "FAILED",
] as const;

export const createImageryMetadataSchema = z.object({
  disasterId: z.string().uuid(),

  sourceType: z.enum(imagerySourceTypes),

  latitude: z.coerce
    .number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: z.coerce
    .number()
    .min(-180)
    .max(180)
    .optional(),

  capturedAt: z.coerce
    .date()
    .optional(),
});

export const imageryIdSchema =
  z.string().uuid();

export const bulkDeleteImagerySchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(100),
});

export type CreateImageryMetadataInput =
  z.infer<typeof createImageryMetadataSchema>;
