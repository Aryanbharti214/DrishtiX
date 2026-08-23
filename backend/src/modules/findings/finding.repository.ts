import {
  db,
} from "../../config/database.js";

import type {
  AIFinding,
  CreateManualFindingInput,
} from "./finding.types.js";


interface FindingRow {
  id: string;

  disaster_id: string;

  imagery_id:
  string | null;

  ai_run_id:
  string | null;

  finding_type:
  string;

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


function mapFinding(
  row: FindingRow
) {
  return {
    id:
      row.id,

    disasterId:
      row.disaster_id,

    imageryId:
      row.imagery_id,

    aiRunId:
      row.ai_run_id,

    type:
      row.finding_type,

    severity:
      row.severity,

    confidence:
      row.confidence,

    location: {
      latitude:
        row.latitude,

      longitude:
        row.longitude,
    },

    prediction:
      row.prediction,

    bbox:
      row.bbox,

    verificationStatus:
      row.verification_status,

    source:
      row.source,

    title:
      row.title,

    description:
      row.description,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}



interface CreateFindingInput {
  disasterId: string;

  imageryId: string;

  aiRunId: string;

  finding: AIFinding;
}


export async function createFinding(
  input: CreateFindingInput
) {
  const result =
    await db.query<FindingRow>(
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
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          'AI',
          $11,
          $12
        )
        RETURNING *
      `,
      [
        input.disasterId,

        input.imageryId,

        input.aiRunId,

        input.finding.type,

        input.finding.severity ??
        null,
        input.finding.confidence ??
        null,


        input.finding.latitude ??
        null,

        input.finding.longitude ??
        null,

        JSON.stringify(
          input.finding.prediction
        ),

        input.finding.bbox
          ? JSON.stringify(
            input.finding.bbox
          )
          : null,

        input.finding.title ??
        null,

        input.finding.description ??
        null,
      ]
    );


  return mapFinding(
    result.rows[0]!
  );
}



export async function createManualFinding(
  input: CreateManualFindingInput
) {
  const result =
    await db.query<FindingRow>(
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
          $2,
          NULL,
          $3,
          $4,
          NULL,
          $5,
          $6,
          $7,
          NULL,
          'RESPONDER',
          $8,
          $9
        )
        RETURNING *
      `,
      [
        input.disasterId,

        input.imageryId ??
        null,

        input.type,

        input.severity,

        input.latitude,

        input.longitude,

        JSON.stringify({
          source:
            "RESPONDER",

          reportedManually:
            true,
        }),

        input.title,

        input.description ??
        null,
      ]
    );


  return mapFinding(
    result.rows[0]!
  );
}



export async function findFindingsByImagery(
  imageryId: string
) {
  const result =
    await db.query<FindingRow>(
      `
        SELECT *
        FROM findings
        WHERE imagery_id = $1
        ORDER BY created_at DESC
      `,
      [
        imageryId,
      ]
    );


  return result.rows.map(
    mapFinding
  );
}


export async function findFindingsByDisaster(
  disasterId: string
) {
  const result =
    await db.query<FindingRow>(
      `
        SELECT *
        FROM findings
        WHERE disaster_id = $1
        ORDER BY created_at DESC
      `,
      [
        disasterId,
      ]
    );


  return result.rows.map(
    mapFinding
  );
}


export async function findFindingById(
  id: string
) {
  const result =
    await db.query<FindingRow>(
      `
        SELECT *
        FROM findings
        WHERE id = $1
        LIMIT 1
      `,
      [
        id,
      ]
    );


  const finding =
    result.rows[0];


  return finding
    ? mapFinding(
      finding
    )
    : null;
}