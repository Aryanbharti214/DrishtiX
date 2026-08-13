import { db } from "../../config/database.js";

export async function createAIRun(
  imageryId: string
) {
  const result = await db.query(
    `
      INSERT INTO ai_runs (
        imagery_id,
        status
      )
      VALUES ($1, 'PENDING')
      RETURNING *
    `,
    [imageryId]
  );

  return result.rows[0];
}

export async function markAIRunProcessing(
  id: string
) {
  await db.query(
    `
      UPDATE ai_runs
      SET
        status = 'PROCESSING',
        started_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [id]
  );
}

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
  const result = await db.query(
    `
      UPDATE ai_runs
      SET
        status = 'SUCCEEDED',
        model_name = $2,
        model_version = $3,
        processing_time_ms = $4,
        raw_output = $5,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      input.modelName ?? null,
      input.modelVersion ?? null,
      input.processingTimeMs ?? null,
      JSON.stringify(input.rawOutput),
    ]
  );

  return result.rows[0];
}

export async function failAIRun(
  id: string,
  errorMessage: string
) {
  const result = await db.query(
    `
      UPDATE ai_runs
      SET
        status = 'FAILED',
        error_message = $2,
        completed_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `,
    [
      id,
      errorMessage,
    ]
  );

  return result.rows[0];
}