import {
  db,
} from "../../config/database.js";


import type {
  ClusterFinding,
  ClusterRelation,
} from "./evidence-cluster.types.js";


interface FindingRow {
  id: string;
  disaster_id: string;
  finding_type: string;
  severity:
    string | null;
  source: string;
  verification_status:
    string;
  title:
    string | null;
  description:
    string | null;
  latitude:
    number | null;
  longitude:
    number | null;
  created_at:
    Date;
}


interface RelationRow {
  id: string;

  finding_a_id: string;

  finding_b_id: string;

  relation_type: string;

  distance_meters:
    number | string;

  score:
    number | string;
}


export async function findClusterFindingsByDisaster(
  disasterId: string
): Promise<
  ClusterFinding[]
> {

  const result =
    await db.query<
      FindingRow
    >(
      `
        SELECT
          id,
          disaster_id,
          finding_type,
          severity,
          source,
          verification_status,
          title,
          description,
          latitude,
          longitude,
          created_at

        FROM findings

        WHERE
          disaster_id = $1

          AND location
              IS NOT NULL

        ORDER BY
          created_at ASC
      `,
      [
        disasterId,
      ]
    );


  return result.rows.map(
    (row) => ({
      id:
        row.id,

      disasterId:
        row.disaster_id,

      type:
        row.finding_type,

      severity:
        row.severity,

      source:
        row.source,

      verificationStatus:
        row.verification_status,

      title:
        row.title,

      description:
        row.description,

      latitude:
        row.latitude,

      longitude:
        row.longitude,

      createdAt:
        row.created_at,
    })
  );
}


export async function findClusterRelationsByDisaster(
  disasterId: string
): Promise<
  ClusterRelation[]
> {

  const result =
    await db.query<
      RelationRow
    >(
      `
        SELECT
          id,
          finding_a_id,
          finding_b_id,
          relation_type,
          distance_meters,
          score

        FROM finding_relations

        WHERE
          disaster_id = $1

        ORDER BY
          score DESC
      `,
      [
        disasterId,
      ]
    );


  return result.rows.map(
    (row) => ({
      id:
        row.id,

      findingAId:
        row.finding_a_id,

      findingBId:
        row.finding_b_id,

      relationType:
        row.relation_type,

      distanceMeters:
        Number(
          row.distance_meters
        ),

      score:
        Number(
          row.score
        ),
    })
  );
}