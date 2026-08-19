import {
  z,
} from "zod";


export const findingTypes = [
  "BUILDING_DAMAGE",
  "ROAD_BLOCKAGE",
  "INFRASTRUCTURE_DAMAGE",
  "SERVICE_DISRUPTION",
] as const;


export const findingSeverities = [
  "LOW",
  "MODERATE",
  "SEVERE",
  "CRITICAL",
] as const;


export const findingSources = [
  "AI",
  "RESPONDER",
  "FUSION",
] as const;


/*
|--------------------------------------------------------------------------
| Generic CV detections
|--------------------------------------------------------------------------
|
| Raw object detection != disaster finding.
|
*/

export const rawDetectionSchema =
  z.object({
    classId:
      z.number()
        .int()
        .nonnegative(),

    className:
      z.string()
        .min(1),

    confidence:
      z.number()
        .min(0)
        .max(1),

    bbox:
      z.array(
        z.number()
      )
        .length(4),
  });


/*
|--------------------------------------------------------------------------
| AI-created disaster finding
|--------------------------------------------------------------------------
*/

export const aiFindingSchema =
  z.object({
    type:
      z.enum(
        findingTypes
      ),

    title:
      z.string()
        .min(3)
        .max(255)
        .optional(),

    description:
      z.string()
        .max(5000)
        .optional(),

    severity:
      z.enum(
        findingSeverities
      )
        .optional(),

    confidence:
      z.number()
        .min(0)
        .max(1),

    latitude:
      z.number()
        .min(-90)
        .max(90)
        .optional(),

    longitude:
      z.number()
        .min(-180)
        .max(180)
        .optional(),

    bbox:
      z.array(
        z.number()
      )
        .length(4)
        .optional(),

    prediction:
      z.record(
        z.string(),
        z.unknown()
      ),
  });


/*
|--------------------------------------------------------------------------
| Manual responder finding
|--------------------------------------------------------------------------
*/

export const createManualFindingSchema =
  z.object({
    disasterId:
      z.string()
        .uuid(),

    imageryId:
      z.string()
        .uuid()
        .optional(),

    type:
      z.enum(
        findingTypes
      ),

    severity:
      z.enum(
        findingSeverities
      ),

    title:
      z.string()
        .trim()
        .min(3)
        .max(255),

    description:
      z.string()
        .trim()
        .max(5000)
        .optional(),

    latitude:
      z.coerce
        .number()
        .min(-90)
        .max(90),

    longitude:
      z.coerce
        .number()
        .min(-180)
        .max(180),
  });


/*
|--------------------------------------------------------------------------
| FastAPI analysis response
|--------------------------------------------------------------------------
*/

export const aiAnalysisResponseSchema =
  z.object({
    imageId:
      z.string()
        .min(1),

    analysisType:
      z.enum([
        "GENERIC_OBJECT_DETECTION",
        "DISASTER_DAMAGE_ASSESSMENT",
      ]),

    model:
      z.object({
        name:
          z.string()
            .min(1),

        version:
          z.string()
            .min(1),
      }),

    processingTimeMs:
      z.number()
        .nonnegative(),

    detections:
      z.array(
        rawDetectionSchema
      )
        .default([]),

    findings:
      z.array(
        aiFindingSchema
      )
        .default([]),
  });


export type AIFinding =
  z.infer<
    typeof aiFindingSchema
  >;


export type RawDetection =
  z.infer<
    typeof rawDetectionSchema
  >;


export type AIAnalysisResponse =
  z.infer<
    typeof aiAnalysisResponseSchema
  >;


export type CreateManualFindingInput =
  z.infer<
    typeof createManualFindingSchema
  >;