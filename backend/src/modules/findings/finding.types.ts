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
        .max(1)
        .optional(),

    bbox:
      z.array(
        z.number()
      )
        .length(4),
  });




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
        .max(1)
        .optional(),


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

export const aiPrioritySchema =
  z.object({

    score:
      z.number()
        .min(0)
        .max(100),

    level:
      z.string(),

    responsePriority:
      z.enum([
        "P1",
        "P2",
        "P3",
        "P4",
      ]),

    impact:
      z.object({

        buildings:
          z.string(),

        roads:
          z.string(),

        water:
          z.string(),
      }),

    recommendedAction:
      z.string(),

    reasons:
      z.array(
        z.string()
      ),

    components:
      z.object({

        buildingImpact:
          z.number(),

        roadImpact:
          z.number(),

        waterExtent:
          z.number(),
      }),
  });


export const segmentationFindingSchema =
  z.object({

    type:
      z.string(),

    severity:
      z.string(),

    pixelCount:
      z.number()
        .int()
        .nonnegative(),

    areaPercentage:
      z.number()
        .min(0)
        .max(100),

    bbox:
      z.array(
        z.number()
      )
        .length(4)
        .nullable()
        .optional(),

    prediction:
      z.record(
        z.string(),
        z.unknown()
      ),
  });


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

    resultImage:
      z.string()
        .min(1)
        .optional(),

    priority:
      aiPrioritySchema
        .optional(),

    segmentationSummary:
      z.array(
        segmentationFindingSchema
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




const findingCorrectionSchema =
  z.object({
    type:
      z.enum(
        findingTypes
      )
        .optional(),

    severity:
      z.enum(
        findingSeverities
      )
        .optional(),

    title:
      z.string()
        .trim()
        .min(3)
        .max(255)
        .optional(),

    description:
      z.string()
        .trim()
        .max(5000)
        .optional(),

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
  })
    .refine(
      (value) =>
        Object.keys(value).length > 0,
      {
        message:
          "At least one corrected field is required",
      }
    )
    .refine(
      (value) => {
        const hasLatitude =
          value.latitude !==
          undefined;

        const hasLongitude =
          value.longitude !==
          undefined;

        return (
          hasLatitude ===
          hasLongitude
        );
      },
      {
        message:
          "Latitude and longitude must be corrected together",
      }
    );


const confirmFindingSchema =
  z.object({
    decision:
      z.literal(
        "CONFIRMED"
      ),

    reviewerLabel:
      z.string()
        .trim()
        .min(2)
        .max(150)
        .optional(),

    reason:
      z.string()
        .trim()
        .max(2000)
        .optional(),
  });


const rejectFindingSchema =
  z.object({
    decision:
      z.literal(
        "REJECTED"
      ),

    reviewerLabel:
      z.string()
        .trim()
        .min(2)
        .max(150)
        .optional(),

    reason:
      z.string()
        .trim()
        .min(3)
        .max(2000),
  });


const correctFindingSchema =
  z.object({
    decision:
      z.literal(
        "CORRECTED"
      ),

    reviewerLabel:
      z.string()
        .trim()
        .min(2)
        .max(150)
        .optional(),

    reason:
      z.string()
        .trim()
        .min(3)
        .max(2000),

    corrected:
      findingCorrectionSchema,
  });


export const verifyFindingSchema =
  z.discriminatedUnion(
    "decision",
    [
      confirmFindingSchema,
      rejectFindingSchema,
      correctFindingSchema,
    ]
  );


export type VerifyFindingInput =
  z.infer<
    typeof verifyFindingSchema
  >;