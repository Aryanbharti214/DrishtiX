import { z } from "zod";

export const findingTypes = [
  "BUILDING_DAMAGE",
  "ROAD_BLOCKAGE",
  "INFRASTRUCTURE_DAMAGE",
  "SERVICE_DISRUPTION",
] as const;

export const aiFindingSchema = z.object({
  type: z.enum(findingTypes),

  severity: z
    .string()
    .optional(),

  confidence: z
    .number()
    .min(0)
    .max(1),

  latitude: z
    .number()
    .min(-90)
    .max(90)
    .optional(),

  longitude: z
    .number()
    .min(-180)
    .max(180)
    .optional(),

  bbox: z
    .array(z.number())
    .length(4)
    .optional(),

  prediction: z.record(
    z.string(),
    z.unknown()
  ),
});

export const aiAnalysisResponseSchema =
  z.object({
    imageId: z.string(),

    model: z.object({
      name: z.string(),
      version: z.string(),
    }),

    processingTimeMs: z
      .number()
      .nonnegative()
      .optional(),

    findings: z.array(
      aiFindingSchema
    ),
  });

export type AIFinding =
  z.infer<typeof aiFindingSchema>;

export type AIAnalysisResponse =
  z.infer<
    typeof aiAnalysisResponseSchema
  >;