import {
  db,
} from "../../config/database.js";


/*
|--------------------------------------------------------------------------
| AI Run database row
|--------------------------------------------------------------------------
*/

export interface AIRunRow {
  id: string;

  imagery_id: string;

  model_name:
    string | null;

  model_version:
    string | null;

  status:
    | "PENDING"
    | "PROCESSING"
    | "SUCCEEDED"
    | "FAILED";

  started_at:
    Date | null;

  completed_at:
    Date | null;

  processing_time_ms:
    number | null;

  raw_output:
    unknown;

  error_message:
    string | null;

  created_at:
    Date;

  updated_at:
    Date;
}


/*
|--------------------------------------------------------------------------
| Create AI run
|--------------------------------------------------------------------------
*/

export async function createAIRun(
  imageryId: string
) {

  const result =
    await db.query<AIRunRow>(
      `
        INSERT INTO ai_runs (
          imagery_id,
          status
        )

        VALUES (
          $1,
          'PENDING'
        )

        RETURNING *
      `,
      [
        imageryId,
      ]
    );


  return result.rows[0]!;
}


/*
|--------------------------------------------------------------------------
| Mark run as processing
|--------------------------------------------------------------------------
*/

export async function markAIRunProcessing(
  id: string
) {

  await db.query(
    `
      UPDATE ai_runs

      SET
        status =
          'PROCESSING',

        started_at =
          NOW(),

        updated_at =
          NOW()

      WHERE id = $1
    `,
    [
      id,
    ]
  );
}


/*
|--------------------------------------------------------------------------
| Complete AI run
|--------------------------------------------------------------------------
*/

interface CompleteAIRunInput {
  modelName?: string;

  modelVersion?: string;

  processingTimeMs?: number;

  rawOutput: unknown;
}


export async function completeAIRun(
  id: string,
  input: CompleteAIRunInput
) {

  const result =
    await db.query<AIRunRow>(
      `
        UPDATE ai_runs

        SET
          status =
            'SUCCEEDED',

          model_name =
            $2,

          model_version =
            $3,

          processing_time_ms =
            $4,

          raw_output =
            $5,

          completed_at =
            NOW(),

          updated_at =
            NOW()

        WHERE id = $1

        RETURNING *
      `,
      [
        id,

        input.modelName ??
          null,

        input.modelVersion ??
          null,

        input.processingTimeMs ??
          null,

        JSON.stringify(
          input.rawOutput
        ),
      ]
    );


  return result.rows[0]!;
}


/*
|--------------------------------------------------------------------------
| Fail AI run
|--------------------------------------------------------------------------
*/

export async function failAIRun(
  id: string,
  errorMessage: string
) {

  const result =
    await db.query<AIRunRow>(
      `
        UPDATE ai_runs

        SET
          status =
            'FAILED',

          error_message =
            $2,

          completed_at =
            NOW(),

          updated_at =
            NOW()

        WHERE id = $1

        RETURNING *
      `,
      [
        id,
        errorMessage,
      ]
    );


  return result.rows[0]!;
}


/*
|--------------------------------------------------------------------------
| Latest successful analysis for imagery
|--------------------------------------------------------------------------
|
| Used when the frontend opens an imagery item after analysis has
| already completed.
|--------------------------------------------------------------------------
*/

export async function findLatestSuccessfulAIRunByImagery(
  imageryId: string
) {

  const result =
    await db.query<AIRunRow>(
      `
        SELECT *

        FROM ai_runs

        WHERE
          imagery_id = $1

          AND status =
            'SUCCEEDED'

        ORDER BY
          completed_at DESC NULLS LAST,
          created_at DESC

        LIMIT 1
      `,
      [
        imageryId,
      ]
    );


  return (
    result.rows[0] ??
    null
  );
}