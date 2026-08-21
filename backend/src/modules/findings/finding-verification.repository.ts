import type {
  PoolClient,
} from "pg";

import {
  db,
} from "../../config/database.js";

import type {
  VerifyFindingInput,
} from "./finding.types.js";


interface FindingDatabaseRow {
  id: string;

  disaster_id: string;

  imagery_id:
    string | null;

  ai_run_id:
    string | null;

  finding_type: string;

  severity:
    string | null;

  confidence:
    number | null;

  latitude:
    number | null;

  longitude:
    number | null;

  prediction:
    unknown;

  bbox:
    unknown;

  verification_status:
    string;

  source:
    string;

  title:
    string | null;

  description:
    string | null;

  created_at:
    Date;

  updated_at:
    Date;
}


interface VerificationRow {
  id: string;

  finding_id: string;

  decision: string;

  reviewer_label:
    string | null;

  reason:
    string | null;

  before_snapshot:
    unknown;

  after_snapshot:
    unknown;

  created_at:
    Date;
}


function createSnapshot(
  finding:
    FindingDatabaseRow
) {
  return {
    type:
      finding.finding_type,

    severity:
      finding.severity,

    confidence:
      finding.confidence,

    title:
      finding.title,

    description:
      finding.description,

    location: {
      latitude:
        finding.latitude,

      longitude:
        finding.longitude,
    },

    source:
      finding.source,

    verificationStatus:
      finding
        .verification_status,
  };
}


function mapVerification(
  row: VerificationRow
) {
  return {
    id:
      row.id,

    findingId:
      row.finding_id,

    decision:
      row.decision,

    reviewerLabel:
      row.reviewer_label,

    reason:
      row.reason,

    beforeSnapshot:
      row.before_snapshot,

    afterSnapshot:
      row.after_snapshot,

    createdAt:
      row.created_at,
  };
}




export async function verifyFindingTransaction(
  findingId: string,
  input: VerifyFindingInput
) {
  const client =
    await db.connect();


  try {

    await client.query(
      "BEGIN"
    );


    /*
     * Lock finding while
     * verification is happening.
     */

    const existingResult =
      await client
        .query<FindingDatabaseRow>(
          `
            SELECT *
            FROM findings
            WHERE id = $1
            FOR UPDATE
          `,
          [
            findingId,
          ]
        );


    const existing =
      existingResult.rows[0];


    if (!existing) {

      await client.query(
        "ROLLBACK"
      );


      return null;
    }


    const beforeSnapshot =
      createSnapshot(
        existing
      );


    let updatedFinding:
      FindingDatabaseRow;


  

    if (
      input.decision ===
      "CONFIRMED"
    ) {

      const updateResult =
        await client
          .query<FindingDatabaseRow>(
            `
              UPDATE findings
              SET
                verification_status =
                    'CONFIRMED',

                updated_at =
                    NOW()

              WHERE id = $1

              RETURNING *
            `,
            [
              findingId,
            ]
          );


      updatedFinding =
        updateResult.rows[0]!;
    }


    /*
    |--------------------------------------------------------------------------
    | REJECT
    |--------------------------------------------------------------------------
    */

    else if (
      input.decision ===
      "REJECTED"
    ) {

      const updateResult =
        await client
          .query<FindingDatabaseRow>(
            `
              UPDATE findings
              SET
                verification_status =
                    'REJECTED',

                updated_at =
                    NOW()

              WHERE id = $1

              RETURNING *
            `,
            [
              findingId,
            ]
          );


      updatedFinding =
        updateResult.rows[0]!;
    }


    

    else {

      const corrected =
        input.corrected;


      const updateResult =
        await client
          .query<FindingDatabaseRow>(
            `
              UPDATE findings
              SET
                finding_type =
                  COALESCE(
                    $2,
                    finding_type
                  ),

                severity =
                  COALESCE(
                    $3,
                    severity
                  ),

                title =
                  COALESCE(
                    $4,
                    title
                  ),

                description =
                  COALESCE(
                    $5,
                    description
                  ),

                latitude =
                  COALESCE(
                    $6,
                    latitude
                  ),

                longitude =
                  COALESCE(
                    $7,
                    longitude
                  ),

                verification_status =
                  'CORRECTED',

                updated_at =
                  NOW()

              WHERE id = $1

              RETURNING *
            `,
            [
              findingId,

              corrected.type ??
                null,

              corrected.severity ??
                null,

              corrected.title ??
                null,

              corrected.description ??
                null,

              corrected.latitude ??
                null,

              corrected.longitude ??
                null,
            ]
          );


      updatedFinding =
        updateResult.rows[0]!;
    }


    const afterSnapshot =
      createSnapshot(
        updatedFinding
      );


    const verificationResult =
      await client
        .query<VerificationRow>(
          `
            INSERT INTO
              finding_verifications (
                finding_id,
                decision,
                reviewer_label,
                reason,
                before_snapshot,
                after_snapshot
              )

            VALUES (
              $1,
              $2,
              $3,
              $4,
              $5,
              $6
            )

            RETURNING *
          `,
          [
            findingId,

            input.decision,

            input.reviewerLabel ??
              null,

            input.reason ??
              null,

            JSON.stringify(
              beforeSnapshot
            ),

            JSON.stringify(
              afterSnapshot
            ),
          ]
        );


    await client.query(
      "COMMIT"
    );


    return {
      verification:
        mapVerification(
          verificationResult
            .rows[0]!
        ),
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

export async function findVerificationHistory(
  findingId: string
) {
  const result =
    await db.query<VerificationRow>(
      `
        SELECT *
        FROM finding_verifications

        WHERE finding_id = $1

        ORDER BY
          created_at DESC
      `,
      [
        findingId,
      ]
    );


  return result.rows.map(
    mapVerification
  );
}