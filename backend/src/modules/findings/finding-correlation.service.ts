import {
  AppError,
} from "../../utils/app-error.js";


import {
  findFindingById,
} from "./finding.repository.js";


import {
  findNearbyFindings,
  findRelationsForFinding,
  replaceFindingRelations,
} from "./finding-correlation.repository.js";


import type {
  ComputedFindingRelation,
  CorrelationFinding,
  FindingRelationType,
} from "./finding-correlation.types.js";


const CORRELATION_RADIUS_METERS =
  250;


const ALGORITHM_VERSION =
  "spatial-correlation-v1";


function isTrusted(
  status: string
) {
  return (
    status ===
      "CONFIRMED"
    ||
    status ===
      "CORRECTED"
  );
}


function roundScore(
  score: number
) {
  return Math.round(
    Math.min(
      1,
      Math.max(
        0,
        score
      )
    ) * 100
  ) / 100;
}


/*
|--------------------------------------------------------------------------
| Classify one pair
|--------------------------------------------------------------------------
|
| Different finding types are NOT automatically conflicts.
|
| Example:
|
| BUILDING_DAMAGE
| +
| ROAD_BLOCKAGE
|
| can both be true at the same location.
|--------------------------------------------------------------------------
*/

function classifyPair(
  target: {
    id: string;

    disasterId: string;

    type: string;

    source: string;

    verificationStatus:
      string;
  },

  candidate:
    CorrelationFinding
):
  ComputedFindingRelation
  | null {

  const distance =
    candidate
      .distanceMeters;


  const timeGap =
    candidate
      .temporalGapMinutes;


  const sameType =
    target.type ===
    candidate.type;


  const sameSource =
    target.source ===
    candidate.source;


  const sourceDiversity =
    !sameSource;


  const targetTrusted =
    isTrusted(
      target
        .verificationStatus
    );


  const candidateTrusted =
    isTrusted(
      candidate
        .verificationStatus
    );


  const targetRejected =
    target
      .verificationStatus ===
    "REJECTED";


  const candidateRejected =
    candidate
      .verificationStatus ===
    "REJECTED";


  let relationType:
    FindingRelationType;


  let score =
    0;


  let rule =
    "";


  /*
   * Actual contradiction:
   *
   * same claim,
   * same approximate location,
   * one accepted/corrected,
   * one explicitly rejected.
   */

  if (
    sameType
    &&
    distance <= 100
    &&
    (
      (
        targetRejected
        &&
        candidateTrusted
      )
      ||
      (
        candidateRejected
        &&
        targetTrusted
      )
    )
  ) {

    relationType =
      "DISPUTED";


    score =
      0.70;


    if (
      distance <= 50
    ) {
      score += 0.15;
    }


    score += 0.15;


    rule =
      "same-type verified/rejected contradiction";

  }


  /*
   * Possible duplicate report.
   *
   * Same source TYPE does not prove
   * same human reporter.
   *
   * Therefore this remains
   * POSSIBLE_DUPLICATE,
   * never automatic deletion.
   */

  else if (
    sameType
    &&
    sameSource
    &&
    distance <= 30
    &&
    timeGap <= 60
  ) {

    relationType =
      "POSSIBLE_DUPLICATE";


    score =
      0.65;


    if (
      distance <= 15
    ) {
      score += 0.20;
    } else {
      score += 0.10;
    }


    if (
      timeGap <= 10
    ) {
      score += 0.15;
    } else if (
      timeGap <= 30
    ) {
      score += 0.10;
    } else {
      score += 0.05;
    }


    rule =
      "same-type nearby same-source report";

  }


  /*
   * Corroboration.
   */

  else if (
    sameType
    &&
    distance <= 100
  ) {

    relationType =
      "CORROBORATES";


    score =
      0.50;


    if (
      distance <= 50
    ) {
      score += 0.15;
    } else {
      score += 0.08;
    }


    if (
      sourceDiversity
    ) {
      score += 0.15;
    }


    if (
      targetTrusted
    ) {
      score += 0.08;
    }


    if (
      candidateTrusted
    ) {
      score += 0.08;
    }


    rule =
      "same-type spatial corroboration";

  }


  /*
   * Different nearby phenomena.
   *
   * This is RELATED, not conflict.
   */

  else if (
    distance <=
    CORRELATION_RADIUS_METERS
  ) {

    relationType =
      "RELATED";


    score =
      0.35;


    if (
      distance <= 100
    ) {
      score += 0.20;
    } else if (
      distance <= 200
    ) {
      score += 0.10;
    }


    if (
      sourceDiversity
    ) {
      score += 0.10;
    }


    if (
      targetTrusted
    ) {
      score += 0.05;
    }


    if (
      candidateTrusted
    ) {
      score += 0.05;
    }


    rule =
      "nearby disaster evidence";

  } else {

    return null;

  }


  return {
    disasterId:
      target.disasterId,

    findingAId:
      target.id,

    findingBId:
      candidate.id,

    relationType,

    distanceMeters:
      Math.round(
        distance * 100
      ) / 100,

    score:
      roundScore(
        score
      ),

    algorithmVersion:
      ALGORITHM_VERSION,

    signals: {
      rule,

      sameType,

      sameSource,

      sourceDiversity,

      distanceMeters:
        Math.round(
          distance * 100
        ) / 100,

      temporalGapMinutes:
        Math.round(
          timeGap * 100
        ) / 100,

      targetSource:
        target.source,

      candidateSource:
        candidate.source,

      targetVerificationStatus:
        target
          .verificationStatus,

      candidateVerificationStatus:
        candidate
          .verificationStatus,

      targetTrusted,

      candidateTrusted,
    },
  };
}


/*
|--------------------------------------------------------------------------
| Rebuild relationships
|--------------------------------------------------------------------------
*/

export async function correlateFindingService(
  findingId: string
) {

  const finding =
    await findFindingById(
      findingId
    );


  if (!finding) {
    throw new AppError(
      404,
      "FINDING_NOT_FOUND",
      "Finding not found"
    );
  }


  if (
    finding.location
      .latitude === null
    ||
    finding.location
      .longitude === null
  ) {

    await replaceFindingRelations(
      findingId,
      []
    );


    return {
      findingId,

      algorithmVersion:
        ALGORITHM_VERSION,

      radiusMeters:
        CORRELATION_RADIUS_METERS,

      relationsGenerated:
        0,

      skipped:
        true,

      reason:
        "Finding has no geospatial location",

      relations:
        [],
    };
  }


  const nearby =
    await findNearbyFindings(
      findingId,
      CORRELATION_RADIUS_METERS
    );


  const relations =
    nearby
      .map(
        (candidate) =>
          classifyPair(
            finding,
            candidate
          )
      )
      .filter(
        (
          relation
        ): relation is
          ComputedFindingRelation =>
          relation !==
          null
      );


  await replaceFindingRelations(
    findingId,
    relations
  );


  return {
    findingId,

    algorithmVersion:
      ALGORITHM_VERSION,

    radiusMeters:
      CORRELATION_RADIUS_METERS,

    candidatesEvaluated:
      nearby.length,

    relationsGenerated:
      relations.length,

    skipped:
      false,

    relations,
  };
}


/*
|--------------------------------------------------------------------------
| Read persisted relationships
|--------------------------------------------------------------------------
*/

export async function getFindingRelationsService(
  findingId: string
) {

  const finding =
    await findFindingById(
      findingId
    );


  if (!finding) {
    throw new AppError(
      404,
      "FINDING_NOT_FOUND",
      "Finding not found"
    );
  }


  return findRelationsForFinding(
    findingId
  );
}