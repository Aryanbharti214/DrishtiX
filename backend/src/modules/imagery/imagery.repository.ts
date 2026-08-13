import { db } from "../../config/database.js";

interface ImageryRow {
  id: string;
  disaster_id: string;

  source_type: string;

  original_filename: string;
  stored_filename: string;
  image_url: string;

  mime_type: string;
  size_bytes: string;

  latitude: number | null;
  longitude: number | null;

  captured_at: Date | null;

  processing_status: string;

  created_at: Date;
  updated_at: Date;
}

interface CreateImageryRecord {
  disasterId: string;
  sourceType: string;

  originalFilename: string;
  storedFilename: string;
  imageUrl: string;

  mimeType: string;
  sizeBytes: number;

  latitude?: number;
  longitude?: number;

  capturedAt?: Date;
}

function mapImagery(row: ImageryRow) {
  return {
    id: row.id,

    disasterId: row.disaster_id,

    sourceType: row.source_type,

    originalFilename:
      row.original_filename,

    storedFilename:
      row.stored_filename,

    imageUrl: row.image_url,

    mimeType: row.mime_type,

    sizeBytes: Number(row.size_bytes),

    location: {
      latitude: row.latitude,
      longitude: row.longitude,
    },

    capturedAt: row.captured_at,

    processingStatus:
      row.processing_status,

    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createImagery(
  input: CreateImageryRecord
) {
  const result =
    await db.query<ImageryRow>(
      `
        INSERT INTO imagery (
          disaster_id,
          source_type,
          original_filename,
          stored_filename,
          image_url,
          mime_type,
          size_bytes,
          latitude,
          longitude,
          captured_at
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
        input.sourceType,

        input.originalFilename,
        input.storedFilename,
        input.imageUrl,

        input.mimeType,
        input.sizeBytes,

        input.latitude ?? null,
        input.longitude ?? null,

        input.capturedAt ?? null,
      ]
    );

  return mapImagery(
    result.rows[0]!
  );
}

export async function findImageryById(
  id: string
) {
  const result =
    await db.query<ImageryRow>(
      `
        SELECT *
        FROM imagery
        WHERE id = $1
        LIMIT 1
      `,
      [id]
    );

  const imagery = result.rows[0];

  return imagery
    ? mapImagery(imagery)
    : null;
}

export async function findImageryByDisaster(
  disasterId: string
) {
  const result =
    await db.query<ImageryRow>(
      `
        SELECT *
        FROM imagery
        WHERE disaster_id = $1
        ORDER BY created_at DESC
      `,
      [disasterId]
    );

  return result.rows.map(mapImagery);
}
