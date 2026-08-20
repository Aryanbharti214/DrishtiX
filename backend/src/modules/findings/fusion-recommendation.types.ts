import {
  z,
} from "zod";


export const fusionRecommendationStatuses = [
  "PENDING",
  "APPROVED",
  "REJECTED",
] as const;


export type FusionRecommendationStatus =
  typeof fusionRecommendationStatuses[number];


export interface CreateFusionRecommendationInput {
  disasterId: string;

  clusterId: string;

  anchorFindingId: string;

  evidenceSignature: string;

  proposedType: string;

  proposedSeverity: string;

  proposedTitle: string;

  proposedDescription: string;

  latitude: number;

  longitude: number;

  supportScore: number;

  evidenceSnapshot:
    Record<string, unknown>;

  signals:
    Record<string, unknown>;

  algorithmVersion: string;
}


const approveFusionSchema =
  z.object({
    decision:
      z.literal(
        "APPROVED"
      ),

    reviewerLabel:
      z.string()
        .trim()
        .min(2)
        .max(150),

    reason:
      z.string()
        .trim()
        .max(2000)
        .optional(),
  });


const rejectFusionSchema =
  z.object({
    decision:
      z.literal(
        "REJECTED"
      ),

    reviewerLabel:
      z.string()
        .trim()
        .min(2)
        .max(150),

    reason:
      z.string()
        .trim()
        .min(3)
        .max(2000),
  });


export const reviewFusionRecommendationSchema =
  z.discriminatedUnion(
    "decision",
    [
      approveFusionSchema,
      rejectFusionSchema,
    ]
  );


export type ReviewFusionRecommendationInput =
  z.infer<
    typeof reviewFusionRecommendationSchema
  >;