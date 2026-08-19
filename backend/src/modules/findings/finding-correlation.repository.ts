import {
  db,
} from "../../config/database.js";


import type {
  ComputedFindingRelation,
  CorrelationFinding,
} from "./finding-correlation.types.js";


interface NearbyFindingRow {
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

  source:
    string;

  verification_status:
    string;

  latitude:
    number | null;

  longitude:
    number | null;

  created_at:
    Date;

  distance_meters:
    number | string;

  temporal_gap_minutes:
    number | string;
}


interface RelationRow {
  id: string;

  disaster_id: string;

  finding_a_id: string;

  finding_b_id: string;

  relation_type: string;

  distance_meters:
    number | string;

  score:
    number | string;

  signals:
    Record<
      string,
      unknown
    >;

  algorithm_version:
    string;

  created_at:
    Date;

  updated_at:
    Date;

  related_finding_id:
    string;

  related_finding_type:
    string;

  related_finding_source:
    string;

  related_finding_severity:
    string | null;

  related_verification_status:
    string;

  related_latitude:
    number | null;

  related_longitude:
    number | null;

  related_title:
    string | null;
}


/*
|--------------------------------------------------------------------------
| Find spatial candidates
|--------------------------------------------------------------------------
|
| Only findings belonging to the SAME disaster
| can be correlated.
|
*/

export async function findNearbyFindings(
  findingId: string,
  radiusMeters: number
): Promise<
  CorrelationFinding[]
> {

  const result =
    await db.query<
      NearbyFindingRow
    >(
      `
        SELECT
          candidate.id,
          candidate.disaster_id,
          candidate.imagery_id,
          candidate.ai_run_id,
          candidate.finding_type,
          candidate.severity,
          candidate.source,
          candidate.verification_status,
          candidate.latitude,
          candidate.longitude,
          candidate.created_at,

          ST_Distance(
            target.location,
            candidate.location
          ) AS distance_meters,

          ABS(
            EXTRACT(
              EPOCH FROM (
                candidate.created_at
                -
                target.created_at
              )
            ) / 60.0
          ) AS temporal_gap_minutes

        FROM findings AS target

        JOIN findings AS candidate
          ON candidate.disaster_id =
             target.disaster_id

         AND candidate.id <>
             target.id

        WHERE
          target.id = $1

          AND target.location
              IS NOT NULL

          AND candidate.location
              IS NOT NULL

          AND ST_DWithin(
            target.location,
            candidate.location,
            $2
          )

        ORDER BY
          distance_meters ASC
      `,
      [
        findingId,
        radiusMeters,
      ]
    );


  return result.rows.map(
    (row) => ({
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

      source:
        row.source,

      verificationStatus:
        row.verification_status,

      latitude:
        row.latitude,

      longitude:
        row.longitude,

      createdAt:
        row.created_at,

      distanceMeters:
        Number(
          row.distance_meters
        ),

      temporalGapMinutes:
        Number(
          row.temporal_gap_minutes
        ),
    })
  );
}


/*
|--------------------------------------------------------------------------
| Replace all relationships for one finding
|--------------------------------------------------------------------------
|
| This is intentional.
|
| If a human corrects a finding's location/type later,
| old spatial relationships must disappear rather than
| remain stale.
|--------------------------------------------------------------------------
*/

export async function replaceFindingRelations(
  findingId: string,
  relations:
    ComputedFindingRelation[]
) {

  const client =
    await db.connect();


  try {

    await client.query(
      "BEGIN"
    );


    await client.query(
      `
        DELETE FROM
          finding_relations

        WHERE
          finding_a_id = $1

          OR finding_b_id = $1
      `,
      [
        findingId,
      ]
    );


    for (
      const relation
      of relations
    ) {

      await client.query(
        `
          INSERT INTO finding_relations (
            disaster_id,
            finding_a_id,
            finding_b_id,
            relation_type,
            distance_meters,
            score,
            signals,
            algorithm_version
          )

          VALUES (
            $1,

            LEAST(
              $2::uuid,
              $3::uuid
            ),

            GREATEST(
              $2::uuid,
              $3::uuid
            ),

            $4,
            $5,
            $6,
            $7,
            $8
          )
        `,
        [
          relation.disasterId,

          relation.findingAId,

          relation.findingBId,

          relation.relationType,

          relation.distanceMeters,

          relation.score,

          JSON.stringify(
            relation.signals
          ),

          relation.algorithmVersion,
        ]
      );
    }


    await client.query(
      "COMMIT"
    );

  } catch (error) {

    await client.query(
      "ROLLBACK"
    );

    throw error;

  } finally {

    client.release();

  }
}


/*
|--------------------------------------------------------------------------
| Read relationships for UI/API
|--------------------------------------------------------------------------
*/

export async function findRelationsForFinding(
  findingId: string
) {

  const result =
    await db.query<
      RelationRow
    >(
      `
        SELECT
          relation.id,
          relation.disaster_id,
          relation.finding_a_id,
          relation.finding_b_id,
          relation.relation_type,
          relation.distance_meters,
          relation.score,
          relation.signals,
          relation.algorithm_version,
          relation.created_at,
          relation.updated_at,

          related.id
            AS related_finding_id,

          related.finding_type
            AS related_finding_type,

          related.source
            AS related_finding_source,

          related.severity
            AS related_finding_severity,

          related.verification_status
            AS related_verification_status,

          related.latitude
            AS related_latitude,

          related.longitude
            AS related_longitude,

          related.title
            AS related_title

        FROM finding_relations
          AS relation

        JOIN findings AS related
          ON related.id =
            CASE

              WHEN
                relation.finding_a_id
                = $1
              THEN
                relation.finding_b_id

              ELSE
                relation.finding_a_id

            END

        WHERE
          relation.finding_a_id = $1

          OR
          relation.finding_b_id = $1

        ORDER BY
          relation.score DESC,
          relation.distance_meters ASC
      `,
      [
        findingId,
      ]
    );


  return result.rows.map(
    (row) => ({
      id:
        row.id,

      disasterId:
        row.disaster_id,

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

      signals:
        row.signals,

      algorithmVersion:
        row.algorithm_version,

      relatedFinding: {
        id:
          row.related_finding_id,

        type:
          row.related_finding_type,

        source:
          row.related_finding_source,

        severity:
          row.related_finding_severity,

        verificationStatus:
          row.related_verification_status,

        title:
          row.related_title,

        location: {
          latitude:
            row.related_latitude,

          longitude:
            row.related_longitude,
        },
      },

      createdAt:
        row.created_at,

      updatedAt:
        row.updated_at,
    })
  );
}