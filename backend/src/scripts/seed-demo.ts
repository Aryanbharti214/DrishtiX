import {
  db,
} from "../config/database.js";

import {
  correlateFindingService,
} from "../modules/findings/finding-correlation.service.js";

import {
  getEvidenceClustersService,
} from "../modules/findings/evidence-cluster.service.js";

import {
  getDisasterPrioritiesService,
} from "../modules/findings/finding-priority.service.js";


const DEMO_NAME =
  "DrishtiX Demo — Bhubaneswar Flood";


type SeedFinding = {
  key: string;

  type:
    | "BUILDING_DAMAGE"
    | "ROAD_BLOCKAGE"
    | "INFRASTRUCTURE_DAMAGE"
    | "SERVICE_DISRUPTION";

  severity:
    | "LOW"
    | "MODERATE"
    | "SEVERE"
    | "CRITICAL";

  source:
    | "AI"
    | "RESPONDER";

  verificationStatus:
    | "PENDING"
    | "CONFIRMED"
    | "REJECTED";

  title: string;

  description: string;

  latitude: number;

  longitude: number;

  minutesAgo: number;
};


const findingsToSeed:
  SeedFinding[] = [

    /*
    |--------------------------------------------------------------------------
    | CLUSTER A
    |--------------------------------------------------------------------------
    |
    | Expected:
    | CORROBORATED
    |
    | - responder + synthetic demo AI
    | - same ROAD_BLOCKAGE type
    | - spatially close
    | - one possible duplicate
    |
    */

    {
      key:
        "ROAD_CONFIRMED",

      type:
        "ROAD_BLOCKAGE",

      severity:
        "CRITICAL",

      source:
        "RESPONDER",

      verificationStatus:
        "CONFIRMED",

      title:
        "NH-16 access road blocked",

      description:
        "Field responder reports severe debris and floodwater blocking emergency vehicle movement.",

      latitude:
        20.29610,

      longitude:
        85.82450,

      minutesAgo:
        30,
    },


    {
      key:
        "ROAD_AI",

      type:
        "ROAD_BLOCKAGE",

      severity:
        "SEVERE",

      source:
        "AI",

      verificationStatus:
        "PENDING",

      title:
        "Synthetic demo road obstruction observation",

      description:
        "Synthetic demonstration evidence representing a machine-assisted road blockage observation. Human verification required.",

      latitude:
        20.29628,

      longitude:
        85.82463,

      minutesAgo:
        24,
    },


    {
      key:
        "ROAD_DUPLICATE",

      type:
        "ROAD_BLOCKAGE",

      severity:
        "SEVERE",

      source:
        "RESPONDER",

      verificationStatus:
        "PENDING",

      title:
        "Second responder report near NH-16",

      description:
        "Nearby responder report describing the same blocked access corridor.",

      latitude:
        20.29618,

      longitude:
        85.82456,

      minutesAgo:
        22,
    },


    /*
    |--------------------------------------------------------------------------
    | CLUSTER B
    |--------------------------------------------------------------------------
    |
    | Expected:
    | DISPUTED
    |
    | Same claim/location:
    |
    | confirmed responder
    | vs
    | rejected synthetic AI observation
    |
    */

    {
      key:
        "BUILDING_CONFIRMED",

      type:
        "BUILDING_DAMAGE",

      severity:
        "CRITICAL",

      source:
        "RESPONDER",

      verificationStatus:
        "CONFIRMED",

      title:
        "Severe structural damage at relief-sector building",

      description:
        "Responder inspection confirms major visible structural damage requiring restricted access.",

      latitude:
        20.30100,

      longitude:
        85.82900,

      minutesAgo:
        45,
    },


    {
      key:
        "BUILDING_REJECTED",

      type:
        "BUILDING_DAMAGE",

      severity:
        "SEVERE",

      source:
        "AI",

      verificationStatus:
        "REJECTED",

      title:
        "Rejected synthetic building damage observation",

      description:
        "Synthetic machine-assisted observation rejected during human review.",

      latitude:
        20.30112,

      longitude:
        85.82905,

      minutesAgo:
        42,
    },


    /*
    |--------------------------------------------------------------------------
    | CLUSTER C
    |--------------------------------------------------------------------------
    |
    | Expected:
    | RELATED
    |
    | Different phenomena near each other.
    |
    */

    {
      key:
        "POWER_OUTAGE",

      type:
        "SERVICE_DISRUPTION",

      severity:
        "MODERATE",

      source:
        "RESPONDER",

      verificationStatus:
        "PENDING",

      title:
        "Power service disruption",

      description:
        "Field team reports loss of grid power affecting the nearby relief sector.",

      latitude:
        20.30700,

      longitude:
        85.83500,

      minutesAgo:
        60,
    },


    {
      key:
        "INFRA_DAMAGE",

      type:
        "INFRASTRUCTURE_DAMAGE",

      severity:
        "SEVERE",

      source:
        "RESPONDER",

      verificationStatus:
        "PENDING",

      title:
        "Utility infrastructure damaged",

      description:
        "Responder reports physical damage to utility infrastructure near the affected service area.",

      latitude:
        20.30745,

      longitude:
        85.83520,

      minutesAgo:
        55,
    },


    /*
    |--------------------------------------------------------------------------
    | ISOLATED FINDING
    |--------------------------------------------------------------------------
    */

    {
      key:
        "ISOLATED_BUILDING",

      type:
        "BUILDING_DAMAGE",

      severity:
        "MODERATE",

      source:
        "RESPONDER",

      verificationStatus:
        "PENDING",

      title:
        "Isolated building damage report",

      description:
        "Single responder observation with no nearby supporting evidence yet.",

      latitude:
        20.31500,

      longitude:
        85.84500,

      minutesAgo:
        10,
    },
  ];


async function main() {

  console.log(
    "\nDrishtiX demo seed starting...\n"
  );


  const client =
    await db.connect();


  let disasterId =
    "";


  const findingIds =
    new Map<
      string,
      string
    >();


  try {

    await client.query(
      "BEGIN"
    );


    /*
    |--------------------------------------------------------------------------
    | Remove ONLY the previous DrishtiX demo
    |--------------------------------------------------------------------------
    |
    | Never touch real disasters.
    |
    */

    const existingDemo =
      await client.query<{
        id: string;
      }>(
        `
          SELECT id
          FROM disasters
          WHERE name = $1
        `,
        [
          DEMO_NAME,
        ]
      );


    for (
      const row
      of existingDemo.rows
    ) {

      /*
       * Delete derived records first.
       */

      await client.query(
        `
          DELETE FROM fusion_recommendations
          WHERE disaster_id = $1
        `,
        [
          row.id,
        ]
      );


      await client.query(
        `
          DELETE FROM finding_relations
          WHERE disaster_id = $1
        `,
        [
          row.id,
        ]
      );


      await client.query(
        `
          DELETE FROM disasters
          WHERE id = $1
        `,
        [
          row.id,
        ]
      );

    }


    /*
    |--------------------------------------------------------------------------
    | Disaster
    |--------------------------------------------------------------------------
    */

    const disasterResult =
      await client.query<{
        id: string;
      }>(
        `
          INSERT INTO disasters (
            name,
            type,
            description,
            region_name,
            start_date,
            status
          )

          VALUES (
            $1,
            'FLOOD',
            $2,
            $3,
            NOW() - INTERVAL '4 hours',
            'ACTIVE'
          )

          RETURNING id
        `,
        [
          DEMO_NAME,

          "Synthetic demonstration incident for DrishtiX evidence correlation, human verification, fusion review and operational prioritization.",

          "Bhubaneswar, Odisha",
        ]
      );


    disasterId =
      disasterResult
        .rows[0]!
        .id;


    /*
    |--------------------------------------------------------------------------
    | Findings
    |--------------------------------------------------------------------------
    */

    for (
      const item
      of findingsToSeed
    ) {

      const createdAt =
        new Date(
          Date.now() -
          item.minutesAgo *
          60 *
          1000
        );


      const prediction = {
        demoSeed:
          true,

        synthetic:
          true,

        origin:
          "DRISHTIX_DEMO_SEED",

        note:
          item.source ===
          "AI"
            ? "Synthetic AI-labelled demonstration evidence. Not a claim that generic object detection classified disaster damage."
            : "Synthetic responder demonstration evidence.",
      };


      const result =
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
              verification_status,
              source,
              title,
              description,
              created_at,
              updated_at
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
              $6::jsonb,
              NULL,
              $7,
              $8,
              $9,
              $10,
              $11,
              $11
            )

            RETURNING id
          `,
          [
            disasterId,

            item.type,

            item.severity,

            item.latitude,

            item.longitude,

            JSON.stringify(
              prediction
            ),

            item.verificationStatus,

            item.source,

            item.title,

            item.description,

            createdAt,
          ]
        );


      findingIds.set(
        item.key,
        result.rows[0]!.id
      );

    }


    /*
    |--------------------------------------------------------------------------
    | Verification history
    |--------------------------------------------------------------------------
    |
    | The statuses above create the current state.
    | These entries make the audit timeline realistic as well.
    |
    */

    const verifiedItems = [
      {
        key:
          "ROAD_CONFIRMED",

        decision:
          "CONFIRMED",

        reason:
          "Responder field inspection confirms road access is blocked.",
      },

      {
        key:
          "BUILDING_CONFIRMED",

        decision:
          "CONFIRMED",

        reason:
          "Physical responder inspection confirms severe structural damage.",
      },

      {
        key:
          "BUILDING_REJECTED",

        decision:
          "REJECTED",

        reason:
          "Human reviewer determined the synthetic machine observation did not represent valid damage evidence.",
      },
    ];


    for (
      const item
      of verifiedItems
    ) {

      const findingId =
        findingIds.get(
          item.key
        );


      if (
        !findingId
      ) {
        continue;
      }


      await client.query(
        `
          INSERT INTO finding_verifications (
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
            'Demo Incident Controller',
            $3,
            $4::jsonb,
            $5::jsonb
          )
        `,
        [
          findingId,

          item.decision,

          item.reason,

          JSON.stringify({
            verificationStatus:
              "PENDING",
          }),

          JSON.stringify({
            verificationStatus:
              item.decision,
          }),
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


  /*
  |--------------------------------------------------------------------------
  | Build spatial relationships
  |--------------------------------------------------------------------------
  |
  | Use the actual DrishtiX correlation engine.
  |
  | We DO NOT manually fake finding_relations.
  |
  */

  console.log(
    "Generating spatial evidence relationships..."
  );


  for (
    const findingId
    of findingIds.values()
  ) {

    const result =
      await correlateFindingService(
        findingId
      );


    console.log(
      `  ${findingId.slice(
        0,
        8
      )}... -> ${result.relationsGenerated} relation(s)`
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Verify derived clusters
  |--------------------------------------------------------------------------
  */

  const clusterResult =
    await getEvidenceClustersService(
      disasterId
    );


  const priorityResult =
    await getDisasterPrioritiesService(
      disasterId
    );


  console.log(
    "\n--------------------------------------------"
  );

  console.log(
    "DrishtiX demo seed complete"
  );

  console.log(
    "--------------------------------------------"
  );


  console.log(
    `Disaster ID: ${disasterId}`
  );


  console.log(
    `Findings: ${findingIds.size}`
  );


  console.log(
    `Clusters: ${clusterResult.clusters.length}`
  );


  for (
    const cluster
    of clusterResult.clusters
  ) {

    console.log(
      `  ${cluster.state.padEnd(
        13
      )} | ${cluster.memberCount} member(s) | ${cluster.clusterId}`
    );

  }


  console.log(
    `Priority queue: ${priorityResult.priorities.length}`
  );


  console.log(
    "\nTop priorities:"
  );


  for (
    const priority
    of priorityResult.priorities.slice(
      0,
      3
    )
  ) {

    console.log(
      `  #${priority.rank} ${priority.priorityLevel} ${priority.priorityScore}/100 — ${priority.title}`
    );

  }


  console.log(
    "\nSelect this disaster in the frontend:"
  );


  console.log(
    DEMO_NAME
  );


  console.log(
    "\nDemo evidence is synthetic and explicitly labelled as such."
  );


  await db.end();

}


main()
  .catch(
    async (
      error
    ) => {

      console.error(
        "\nDemo seed failed:"
      );

      console.error(
        error
      );


      try {

        await db.end();

      } catch {
        // Ignore shutdown error.
      }


      process.exit(
        1
      );

    }
  );