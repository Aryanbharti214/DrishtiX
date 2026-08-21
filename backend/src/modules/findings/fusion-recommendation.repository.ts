import {
  db,
} from "../../config/database.js";


import type {
  CreateFusionRecommendationInput,
  ReviewFusionRecommendationInput,
} from "./fusion-recommendation.types.js";


interface FusionRecommendationRow {
  id: string;

  disaster_id: string;

  cluster_id: string;

  anchor_finding_id: string;

  evidence_signature: string;

  proposed_type: string;

  proposed_severity: string;

  proposed_title: string;

  proposed_description: string;

  latitude: number;

  longitude: number;

  support_score:
    number | string;

  evidence_snapshot:
    Record<string, unknown>;

  signals:
    Record<string, unknown>;

  algorithm_version: string;

  status: string;

  reviewer_label:
    string | null;

  review_reason:
    string | null;

  resulting_finding_id:
    string | null;

  reviewed_at:
    Date | null;

  created_at:
    Date;

  updated_at:
    Date;
}


function mapFusionRecommendation(
  row: FusionRecommendationRow
) {
  return {
    id:
      row.id,

    disasterId:
      row.disaster_id,

    clusterId:
      row.cluster_id,

    anchorFindingId:
      row.anchor_finding_id,

    evidenceSignature:
      row.evidence_signature,

    proposedType:
      row.proposed_type,

    proposedSeverity:
      row.proposed_severity,

    proposedTitle:
      row.proposed_title,

    proposedDescription:
      row.proposed_description,

    location: {
      latitude:
        row.latitude,

      longitude:
        row.longitude,
    },

    supportScore:
      Number(
        row.support_score
      ),

    evidenceSnapshot:
      row.evidence_snapshot,

    signals:
      row.signals,

    algorithmVersion:
      row.algorithm_version,

    status:
      row.status,

    reviewerLabel:
      row.reviewer_label,

    reviewReason:
      row.review_reason,

    resultingFindingId:
      row.resulting_finding_id,

    reviewedAt:
      row.reviewed_at,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}


export async function findExistingFusionRecommendation(
  disasterId: string,
  clusterId: string,
  evidenceSignature: string
) {
  const result =
    await db.query<
      FusionRecommendationRow
    >(
      `
        SELECT *

        FROM fusion_recommendations

        WHERE
          disaster_id = $1

          AND cluster_id = $2

          AND evidence_signature = $3

        LIMIT 1
      `,
      [
        disasterId,
        clusterId,
        evidenceSignature,
      ]
    );


  const row =
    result.rows[0];


  return row
    ? mapFusionRecommendation(
        row
      )
    : null;
}


export async function createFusionRecommendation(
  input:
    CreateFusionRecommendationInput
) {
  const result =
    await db.query<
      FusionRecommendationRow
    >(
      `
        INSERT INTO fusion_recommendations (
          disaster_id,
          cluster_id,
          anchor_finding_id,
          evidence_signature,
          proposed_type,
          proposed_severity,
          proposed_title,
          proposed_description,
          latitude,
          longitude,
          support_score,
          evidence_snapshot,
          signals,
          algorithm_version
        )

        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14
        )

        RETURNING *
      `,
      [
        input.disasterId,

        input.clusterId,

        input.anchorFindingId,

        input.evidenceSignature,

        input.proposedType,

        input.proposedSeverity,

        input.proposedTitle,

        input.proposedDescription,

        input.latitude,

        input.longitude,

        input.supportScore,

        JSON.stringify(
          input.evidenceSnapshot
        ),

        JSON.stringify(
          input.signals
        ),

        input.algorithmVersion,
      ]
    );


  return mapFusionRecommendation(
    result.rows[0]!
  );
}


export async function findFusionRecommendationById(
  id: string
) {
  const result =
    await db.query<
      FusionRecommendationRow
    >(
      `
        SELECT *

        FROM fusion_recommendations

        WHERE id = $1

        LIMIT 1
      `,
      [
        id,
      ]
    );


  const row =
    result.rows[0];


  return row
    ? mapFusionRecommendation(
        row
      )
    : null;
}


export async function findFusionRecommendationsByDisaster(
  disasterId: string
) {
  const result =
    await db.query<
      FusionRecommendationRow
    >(
      `
        SELECT *

        FROM fusion_recommendations

        WHERE disaster_id = $1

        ORDER BY
          created_at DESC
      `,
      [
        disasterId,
      ]
    );


  return result.rows.map(
    mapFusionRecommendation
  );
}


export async function reviewFusionRecommendationTransaction(
  recommendationId: string,
  input:
    ReviewFusionRecommendationInput
) {
  const client =
    await db.connect();


  try {

    await client.query(
      "BEGIN"
    );


    const existingResult =
      await client.query<
        FusionRecommendationRow
      >(
        `
          SELECT *

          FROM fusion_recommendations

          WHERE id = $1

          FOR UPDATE
        `,
        [
          recommendationId,
        ]
      );


    const existing =
      existingResult.rows[0];


    if (!existing) {

      await client.query(
        "ROLLBACK"
      );


      return {
        kind:
          "NOT_FOUND" as const,
      };
    }


    if (
      existing.status !==
      "PENDING"
    ) {

      await client.query(
        "ROLLBACK"
      );


      return {
        kind:
          "ALREADY_REVIEWED" as const,

        recommendation:
          mapFusionRecommendation(
            existing
          ),
      };
    }


    let resultingFindingId:
      string | null =
      null;


  
    if (
      input.decision ===
      "APPROVED"
    ) {

      const findingResult =
        await client.query<{
          id: string;
        }>(
          `
            INSERT INTO findings (
              disaster_id,
              imagery_id,
              ai_run_id,
              finding_type,
              severity,
              confidence,
              latitude,
              longitude,
              prediction,
              bbox,
              source,
              title,
              description
            )

            VALUES (
              $1,
              NULL,
              NULL,
              $2,
              $3,
              NULL,
              $4,
              $5,
              $6,
              NULL,
              'FUSION',
              $7,
              $8
            )

            RETURNING id
          `,
          [
            existing.disaster_id,

            existing.proposed_type,

            existing.proposed_severity,

            existing.latitude,

            existing.longitude,

            JSON.stringify({
              source:
                "FUSION",

              fusionRecommendationId:
                existing.id,

              clusterId:
                existing.cluster_id,

              evidenceSignature:
                existing
                  .evidence_signature,

              algorithmVersion:
                existing
                  .algorithm_version,

              supportScore:
                Number(
                  existing
                    .support_score
                ),

              humanApproved:
                true,

              verificationRequired:
                true,
            }),

            existing.proposed_title,

            existing.proposed_description,
          ]
        );


      resultingFindingId =
        findingResult.rows[0]!.id;
    }


    const updatedResult =
      await client.query<
        FusionRecommendationRow
      >(
        `
          UPDATE fusion_recommendations

          SET
            status = $2,

            reviewer_label = $3,

            review_reason = $4,

            resulting_finding_id = $5,

            reviewed_at = NOW(),

            updated_at = NOW()

          WHERE id = $1

          RETURNING *
        `,
        [
          recommendationId,

          input.decision,

          input.reviewerLabel,

          input.reason ??
            null,

          resultingFindingId,
        ]
      );


    await client.query(
      "COMMIT"
    );


    return {
      kind:
        "REVIEWED" as const,

      recommendation:
        mapFusionRecommendation(
          updatedResult.rows[0]!
        ),

      resultingFindingId,
    };

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );


    throw error;

  } finally {

    client.release();

  }
}