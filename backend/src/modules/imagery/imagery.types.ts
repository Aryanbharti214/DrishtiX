import { z } from "zod";

export const imagerySourceTypes = [
  "SATELLITE",
  "DRONE",
  "STREET",
] as const;

export type ImagerySourceType =
  (typeof imagerySourceTypes)[number];

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

export const analyzeImageryRequestSchema = z.object({
  analysisMode: z.enum(["SINGLE_IMAGE", "BEFORE_AFTER"])
    .default("SINGLE_IMAGE"),
  beforeImageryId: z.string().uuid().optional(),
}).superRefine((value, context) => {
  if (value.analysisMode === "BEFORE_AFTER" && !value.beforeImageryId) {
    context.addIssue({
      code: "custom",
      path: ["beforeImageryId"],
      message: "A Before image is required",
    });
  }
});

export type AnalyzeImageryRequest =
  z.infer<typeof analyzeImageryRequestSchema>;

export type CreateImageryMetadataInput =
  z.infer<typeof createImageryMetadataSchema>;
