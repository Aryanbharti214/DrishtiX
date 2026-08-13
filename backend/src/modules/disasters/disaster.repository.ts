import { db } from "../../config/database.js";

import type {
  CreateDisasterInput,
  UpdateDisasterInput,
} from "./disaster.types.js";

interface DisasterRow {
  id: string;
  name: string;
  type: string;
  description: string | null;
  region_name: string | null;
  start_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function mapDisaster(row: DisasterRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    regionName: row.region_name,
    startDate: row.start_date,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createDisaster(
  input: CreateDisasterInput
) {
  const result = await db.query<DisasterRow>(
    `
      INSERT INTO disasters (
        name,
        type,
        description,
        region_name,
        start_date,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
    [
      input.name,
      input.type,
      input.description ?? null,
      input.regionName ?? null,
      input.startDate,
      input.status,
    ]
  );

  return mapDisaster(result.rows[0]!);
}

export async function findAllDisasters() {
  const result = await db.query<DisasterRow>(
    `
      SELECT *
      FROM disasters
      ORDER BY created_at DESC
    `
  );

  return result.rows.map(mapDisaster);
}

export async function findDisasterById(
  id: string
) {
  const result = await db.query<DisasterRow>(
    `
      SELECT *
      FROM disasters
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );

  const disaster = result.rows[0];

  return disaster
    ? mapDisaster(disaster)
    : null;
}

export async function updateDisaster(
  id: string,
  input: UpdateDisasterInput
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  let parameterIndex = 1;

  if (input.name !== undefined) {
    fields.push(`name = $${parameterIndex++}`);
    values.push(input.name);
  }

  if (input.type !== undefined) {
    fields.push(`type = $${parameterIndex++}`);
    values.push(input.type);
  }

  if (input.description !== undefined) {
    fields.push(
      `description = $${parameterIndex++}`
    );
    values.push(input.description);
  }

  if (input.regionName !== undefined) {
    fields.push(
      `region_name = $${parameterIndex++}`
    );
    values.push(input.regionName);
  }

  if (input.startDate !== undefined) {
    fields.push(
      `start_date = $${parameterIndex++}`
    );
    values.push(input.startDate);
  }

  if (input.status !== undefined) {
    fields.push(
      `status = $${parameterIndex++}`
    );
    values.push(input.status);
  }

  fields.push("updated_at = NOW()");

  values.push(id);

  const result = await db.query<DisasterRow>(
    `
      UPDATE disasters
      SET ${fields.join(", ")}
      WHERE id = $${parameterIndex}
      RETURNING *
    `,
    values
  );

  const disaster = result.rows[0];

  return disaster
    ? mapDisaster(disaster)
    : null;
}