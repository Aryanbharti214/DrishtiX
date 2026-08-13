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

export type CreateImageryMetadataInput =
  z.infer<typeof createImageryMetadataSchema>;