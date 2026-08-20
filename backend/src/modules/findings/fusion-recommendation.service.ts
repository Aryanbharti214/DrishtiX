import {
  createHash,
} from "node:crypto";


import {
  AppError,
} from "../../utils/app-error.js";


import {
  findDisasterById,
} from "../disasters/disaster.repository.js";


import {
  getEvidenceClustersService,
} from "./evidence-cluster.service.js";


import {
  createFusionRecommendation,
  findExistingFusionRecommendation,
  findFusionRecommendationById,
  findFusionRecommendationsByDisaster,
  reviewFusionRecommendationTransaction,
} from "./fusion-recommendation.repository.js";


import {
  findFindingById,
} from "./finding.repository.js";


import {
  refreshFindingCorrelationBestEffort,
} from "./finding-correlation.service.js";


import type {
  ReviewFusionRecommendationInput,
} from "./fusion-recommendation.types.js";


const FUSION_ALGORITHM_VERSION =
  "fusion-recommendation-v1";


const severityRank:
  Record<
    string,
    number
  > = {
    LOW: 1,

    MODERATE: 2,

    SEVERE: 3,

    CRITICAL: 4,
  };


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


function prettyType(
  value: string
) {
  return value.replaceAll(
    "_",
    " "
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


export async function generateFusionRecommendationService(
  disasterId: string,
  anchorFindingId: string
) {

  const clusterResult =
    await getEvidenceClustersService(
      disasterId
    );


  const cluster =
    clusterResult.clusters.find(
      (candidate) =>
        candidate.anchorFindingId ===
        anchorFindingId
    );


  if (!cluster) {

    throw new AppError(
      404,
      "EVIDENCE_CLUSTER_NOT_FOUND",
      "Evidence cluster not found"
    );

  }


  /*
   * Only corroborated evidence can
   * produce a fusion recommendation.
   */

  if (
    cluster.state ===
    "DISPUTED"
  ) {

    throw new AppError(
      409,
      "FUSION_CLUSTER_DISPUTED",
      "Disputed evidence must be resolved before fusion can be recommended"
    );

  }


  if (
    cluster.state !==
    "CORROBORATED"
  ) {

    throw new AppError(
      409,
      "FUSION_CLUSTER_NOT_CORROBORATED",
      "Fusion requires a corroborated evidence cluster"
    );

  }


  const activeMembers =
    cluster.members.filter(
      (member) =>
        member.verificationStatus !==
          "REJECTED"
        &&
        member.source !==
          "FUSION"
    );


  if (
    activeMembers.length < 2
  ) {

    throw new AppError(
      409,
      "FUSION_INSUFFICIENT_EVIDENCE",
      "At least two active evidence observations are required"
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Dominant finding type
  |--------------------------------------------------------------------------
  |
  | Trusted findings receive weight 2.
  | Pending findings receive weight 1.
  |
  | This is deterministic evidence weighting,
  | not ML probability.
  |--------------------------------------------------------------------------
  */

  const typeScores =
    new Map<
      string,
      {
        score: number;
        count: number;
      }
    >();


  for (
    const member
    of activeMembers
  ) {

    const weight =
      isTrusted(
        member.verificationStatus
      )
        ? 2
        : 1;


    const current =
      typeScores.get(
        member.type
      ) ?? {
        score: 0,
        count: 0,
      };


    current.score +=
      weight;


    current.count +=
      1;


    typeScores.set(
      member.type,
      current
    );

  }


  const rankedTypes =
    [
      ...typeScores.entries(),
    ].sort(
      (a, b) => {

        if (
          b[1].score !==
          a[1].score
        ) {

          return (
            b[1].score -
            a[1].score
          );

        }


        if (
          b[1].count !==
          a[1].count
        ) {

          return (
            b[1].count -
            a[1].count
          );

        }


        return a[0]
          .localeCompare(
            b[0]
          );

      }
    );


  const winner =
    rankedTypes[0];


  if (!winner) {

    throw new AppError(
      409,
      "FUSION_NO_DOMINANT_TYPE",
      "No dominant evidence type could be determined"
    );

  }


  const second =
    rankedTypes[1];


  if (
    second &&
    second[1].score ===
      winner[1].score &&
    second[1].count ===
      winner[1].count
  ) {

    throw new AppError(
      409,
      "FUSION_AMBIGUOUS_TYPE",
      "Evidence types are tied; human review is required before fusion"
    );

  }


  const proposedType =
    winner[0];


  const dominantMembers =
    activeMembers.filter(
      (member) =>
        member.type ===
        proposedType
    );


  if (
    dominantMembers.length < 2
  ) {

    throw new AppError(
      409,
      "FUSION_INSUFFICIENT_DOMINANT_EVIDENCE",
      "At least two active observations must support the proposed finding type"
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Severity
  |--------------------------------------------------------------------------
  |
  | Prefer trusted matching evidence.
  |
  | If none are verified yet, use active
  | dominant evidence.
  |--------------------------------------------------------------------------
  */

  const trustedDominantMembers =
    dominantMembers.filter(
      (member) =>
        isTrusted(
          member.verificationStatus
        )
    );


  const severityCandidates =
    trustedDominantMembers.length >
      0
      ? trustedDominantMembers
      : dominantMembers;


  const proposedSeverity =
    severityCandidates
      .map(
        (member) =>
          member.severity
      )
      .filter(
        (
          severity
        ): severity is string =>
          severity !== null
      )
      .sort(
        (a, b) =>
          (
            severityRank[b] ??
            0
          ) -
          (
            severityRank[a] ??
            0
          )
      )[0];


  if (!proposedSeverity) {

    throw new AppError(
      409,
      "FUSION_SEVERITY_UNAVAILABLE",
      "Fusion recommendation requires severity information"
    );

  }


  /*
  |--------------------------------------------------------------------------
  | Spatial center of supporting claim
  |--------------------------------------------------------------------------
  */

  const latitude =
    dominantMembers.reduce(
      (
        total,
        member
      ) =>
        total +
        Number(
          member.latitude
        ),
      0
    ) /
    dominantMembers.length;


  const longitude =
    dominantMembers.reduce(
      (
        total,
        member
      ) =>
        total +
        Number(
          member.longitude
        ),
      0
    ) /
    dominantMembers.length;


  const sourceTypes =
    [
      ...new Set(
        dominantMembers.map(
          (member) =>
            member.source
        )
      ),
    ];


  const trustedCount =
    dominantMembers.filter(
      (member) =>
        isTrusted(
          member.verificationStatus
        )
    ).length;


  const pendingCount =
    dominantMembers.filter(
      (member) =>
        member.verificationStatus ===
        "PENDING"
    ).length;


  /*
  |--------------------------------------------------------------------------
  | Transparent support score
  |--------------------------------------------------------------------------
  |
  | NOT a probability.
  |--------------------------------------------------------------------------
  */

  let supportScore =
    0.40;


  if (
    dominantMembers.length >=
    2
  ) {
    supportScore +=
      0.15;
  }


  if (
    sourceTypes.length >=
    2
  ) {
    supportScore +=
      0.15;
  }


  if (
    trustedCount >=
    1
  ) {
    supportScore +=
      0.10;
  }


  if (
    trustedCount >=
    2
  ) {
    supportScore +=
      0.10;
  }


  if (
    dominantMembers.length ===
    activeMembers.length
  ) {
    supportScore +=
      0.10;
  }


  supportScore =
    roundScore(
      supportScore
    );


  const proposedTitle =
    `Proposed fusion: ${prettyType(
      proposedType
    )}`;


  const proposedDescription =
    [
      `Synthesis of ${dominantMembers.length} active ${prettyType(
        proposedType
      ).toLowerCase()} observations within one corroborated evidence cluster.`,

      `${trustedCount} supporting observations are confirmed/corrected and ${pendingCount} remain pending.`,

      "Human approval is required before this synthesis becomes a FUSION finding.",

      "The resulting FUSION finding still enters the normal verification workflow.",
    ].join(
      " "
    );


  /*
  |--------------------------------------------------------------------------
  | Evidence signature
  |--------------------------------------------------------------------------
  */

  const signaturePayload = {
    activeMembers:
      activeMembers
        .map(
          (member) => ({
            id:
              member.id,

            type:
              member.type,

            severity:
              member.severity,

            source:
              member.source,

            verificationStatus:
              member
                .verificationStatus,

            latitude:
              member.latitude,

            longitude:
              member.longitude,
          })
        )
        .sort(
          (a, b) =>
            a.id.localeCompare(
              b.id
            )
        ),

    relations:
      cluster.relations
        .map(
          (relation) => ({
            id:
              relation.id,

            findingAId:
              relation.findingAId,

            findingBId:
              relation.findingBId,

            relationType:
              relation.relationType,

            distanceMeters:
              relation.distanceMeters,

            score:
              relation.score,
          })
        )
        .sort(
          (a, b) =>
            a.id.localeCompare(
              b.id
            )
        ),
  };


  const evidenceSignature =
    createHash(
      "sha256"
    )
      .update(
        JSON.stringify(
          signaturePayload
        )
      )
      .digest(
        "hex"
      );


  const existing =
    await findExistingFusionRecommendation(
      disasterId,
      cluster.clusterId,
      evidenceSignature
    );


  if (existing) {

    return {
      created:
        false,

      recommendation:
        existing,
    };

  }


  const recommendation =
    await createFusionRecommendation({
      disasterId,

      clusterId:
        cluster.clusterId,

      anchorFindingId:
        cluster.anchorFindingId,

      evidenceSignature,

      proposedType,

      proposedSeverity,

      proposedTitle,

      proposedDescription,

      latitude,

      longitude,

      supportScore,

      evidenceSnapshot: {
        cluster,
      },

      signals: {
        reasonCodes: [
          "CORROBORATED_CLUSTER",
          "DOMINANT_FINDING_TYPE",
          "MULTIPLE_ACTIVE_OBSERVATIONS",
        ],

        clusterState:
          cluster.state,

        dominantType:
          proposedType,

        activeEvidenceCount:
          activeMembers.length,

        dominantEvidenceCount:
          dominantMembers.length,

        trustedEvidenceCount:
          trustedCount,

        pendingEvidenceCount:
          pendingCount,

        sourceTypes,

        relationCounts:
          cluster.relationCounts,
      },

      algorithmVersion:
        FUSION_ALGORITHM_VERSION,
    });


  return {
    created:
      true,

    recommendation,
  };
}


export async function getFusionRecommendationsService(
  disasterId: string
) {

  const disaster =
    await findDisasterById(
      disasterId
    );


  if (!disaster) {

    throw new AppError(
      404,
      "DISASTER_NOT_FOUND",
      "Disaster not found"
    );

  }


  return findFusionRecommendationsByDisaster(
    disasterId
  );
}


export async function reviewFusionRecommendationService(
  recommendationId: string,
  input:
    ReviewFusionRecommendationInput
) {

  const existing =
    await findFusionRecommendationById(
      recommendationId
    );


  if (!existing) {

    throw new AppError(
      404,
      "FUSION_RECOMMENDATION_NOT_FOUND",
      "Fusion recommendation not found"
    );

  }


  const result =
    await reviewFusionRecommendationTransaction(
      recommendationId,
      input
    );


  if (
    result.kind ===
    "NOT_FOUND"
  ) {

    throw new AppError(
      404,
      "FUSION_RECOMMENDATION_NOT_FOUND",
      "Fusion recommendation not found"
    );

  }


  if (
    result.kind ===
    "ALREADY_REVIEWED"
  ) {

    throw new AppError(
      409,
      "FUSION_RECOMMENDATION_ALREADY_REVIEWED",
      "Fusion recommendation has already been reviewed"
    );

  }


  let finding =
    null;


  if (
    result.resultingFindingId
  ) {

    await refreshFindingCorrelationBestEffort(
      result.resultingFindingId
    );


    finding =
      await findFindingById(
        result.resultingFindingId
      );

  }


  return {
    recommendation:
      result.recommendation,

    finding,
  };
}