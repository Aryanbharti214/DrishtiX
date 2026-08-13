import { db } from "../../config/database.js";

import type {
  AIFinding,
} from "./finding.types.js";

interface CreateFindingInput {
  disasterId: string;
  imageryId: string;
  aiRunId: string;

  finding: AIFinding;
}

export async function createFinding(
  input: CreateFindingInput
) {
  const result = await db.query(
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
        bbox
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
        $10
      )
      RETURNING *
    `,
    [
      input.disasterId,
      input.imageryId,
      input.aiRunId,

      input.finding.type,

      input.finding.severity ?? null,

      input.finding.confidence,

      input.finding.latitude ?? null,

      input.finding.longitude ?? null,

      JSON.stringify(
        input.finding.prediction
      ),

      input.finding.bbox
        ? JSON.stringify(
            input.finding.bbox
          )
        : null,
    ]
  );

  return result.rows[0];
}

export async function findFindingsByImagery(
  imageryId: string
) {
  const result = await db.query(
    `
      SELECT *
      FROM findings
      WHERE imagery_id = $1
      ORDER BY created_at ASC
    `,
    [imageryId]
  );

  return result.rows;
}

export async function findFindingsByDisaster(
  disasterId: string
) {
  const result = await db.query(
    `
      SELECT *
      FROM findings
      WHERE disaster_id = $1
      ORDER BY created_at DESC
    `,
    [disasterId]
  );

  return result.rows;
}

export async function findFindingById(
  id: string
) {
  const result = await db.query(
    `
      SELECT *
      FROM findings
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  return result.rows[0] ?? null;
}