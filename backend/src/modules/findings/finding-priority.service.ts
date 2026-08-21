import {
  findFindingsByDisaster,
} from "./finding.repository.js";


import {
  getEvidenceClustersService,
} from "./evidence-cluster.service.js";


const PRIORITY_ALGORITHM_VERSION =
  "finding-priority-v1";


const severityScores:
  Record<string, number> = {
    LOW: 10,

    MODERATE: 20,

    SEVERE: 30,

    CRITICAL: 40,
  };


function getRecencyScore(
  createdAt: Date
) {

  const ageHours =
    (
      Date.now() -
      new Date(
        createdAt
      ).getTime()
    ) /
    (
      1000 *
      60 *
      60
    );


  if (
    ageHours <= 6
  ) {
    return 10;
  }


  if (
    ageHours <= 24
  ) {
    return 7;
  }


  if (
    ageHours <= 72
  ) {
    return 4;
  }


  return 1;
}


function getVerificationScore(
  status: string
) {

  switch (
    status
  ) {

    /*
     * This is an inspection queue.
     *
     * PENDING receives slightly more
     * urgency because it still needs
     * human attention.
     */

    case "PENDING":
      return 15;


    case "CONFIRMED":

    case "CORRECTED":
      return 10;


    default:
      return 0;
  }
}


function getClusterScore(
  state:
    string | null
) {

  switch (
    state
  ) {

  
    case "DISPUTED":
      return 18;


    case "CORROBORATED":
      return 15;


    case "RELATED":
      return 6;


    default:
      return 0;
  }
}


function getPriorityLevel(
  score: number
) {

  if (
    score >= 80
  ) {
    return "CRITICAL";
  }


  if (
    score >= 60
  ) {
    return "HIGH";
  }


  if (
    score >= 40
  ) {
    return "MEDIUM";
  }


  return "LOW";
}


export async function getDisasterPrioritiesService(
  disasterId: string
) {

  const [
    findings,
    clusterResult,
  ] =
    await Promise.all([
      findFindingsByDisaster(
        disasterId
      ),

      getEvidenceClustersService(
        disasterId
      ),
    ]);


  const clusterByFindingId =
    new Map<
      string,
      typeof clusterResult
        .clusters[number]
    >();


  for (
    const cluster
    of clusterResult.clusters
  ) {

    for (
      const member
      of cluster.members
    ) {

      clusterByFindingId.set(
        member.id,
        cluster
      );

    }

  }


  const priorities =
    findings
   
      .filter(
        (finding) =>
          finding
            .verificationStatus !==
          "REJECTED"
      )
      .map(
        (finding) => {

          const cluster =
            clusterByFindingId.get(
              finding.id
            ) ??
            null;


          const severityScore =
            severityScores[
              finding.severity ??
              ""
            ] ??
            0;


          const verificationScore =
            getVerificationScore(
              finding
                .verificationStatus
            );


          const clusterScore =
            getClusterScore(
              cluster?.state ??
              null
            );


          const sourceDiversityScore =
            cluster
              ? Math.min(
                  8,
                  Math.max(
                    0,
                    (
                      cluster
                        .sources
                        .length -
                      1
                    ) *
                    4
                  )
                )
              : 0;


          const corroborationScore =
            cluster
              ? Math.min(
                  8,
                  cluster
                    .relationCounts
                    .corroborates *
                    4
                )
              : 0;


          const recencyScore =
            getRecencyScore(
              finding.createdAt
            );


        
          const fusionReviewScore =
            (
              finding.source ===
                "FUSION"
              &&
              finding
                .verificationStatus ===
                "PENDING"
            )
              ? 7
              : 0;


          const rawScore =
            severityScore +
            verificationScore +
            clusterScore +
            sourceDiversityScore +
            corroborationScore +
            recencyScore +
            fusionReviewScore;


          const priorityScore =
            Math.min(
              100,
              rawScore
            );


          const reasons:
            string[] =
            [];


          if (
            finding.severity ===
            "CRITICAL"
          ) {

            reasons.push(
              "Critical severity observation"
            );

          } else if (
            finding.severity ===
            "SEVERE"
          ) {

            reasons.push(
              "Severe impact observation"
            );

          }


          if (
            finding
              .verificationStatus ===
            "PENDING"
          ) {

            reasons.push(
              "Awaiting human verification"
            );

          }


          if (
            cluster?.state ===
            "DISPUTED"
          ) {

            reasons.push(
              "Contradictory evidence requires review"
            );

          }


          if (
            cluster?.state ===
            "CORROBORATED"
          ) {

            reasons.push(
              "Supported by spatially corroborating evidence"
            );

          }


          if (
            (
              cluster?.sources
                .length ??
              0
            ) >= 2
          ) {

            reasons.push(
              "Multiple evidence source types"
            );

          }


          if (
            (
              cluster
                ?.relationCounts
                .corroborates ??
              0
            ) > 0
          ) {

            reasons.push(
              `${cluster!.relationCounts.corroborates} corroborating relationship(s)`
            );

          }


          if (
            finding.source ===
            "FUSION"
          ) {

            reasons.push(
              "Human-approved fusion finding awaiting verification"
            );

          }


          return {
            findingId:
              finding.id,

            disasterId:
              finding.disasterId,

            title:
              finding.title,

            type:
              finding.type,

            severity:
              finding.severity,

            source:
              finding.source,

            verificationStatus:
              finding
                .verificationStatus,

            location:
              finding.location,

            createdAt:
              finding.createdAt,

            priorityScore,

            priorityLevel:
              getPriorityLevel(
                priorityScore
              ),

            algorithmVersion:
              PRIORITY_ALGORITHM_VERSION,

            components: {
              severity:
                severityScore,

              verification:
                verificationScore,

              evidenceState:
                clusterScore,

              sourceDiversity:
                sourceDiversityScore,

              corroboration:
                corroborationScore,

              recency:
                recencyScore,

              fusionReview:
                fusionReviewScore,
            },

            reasons,

            cluster:
              cluster
                ? {
                    clusterId:
                      cluster.clusterId,

                    state:
                      cluster.state,

                    memberCount:
                      cluster.memberCount,

                    activeEvidenceCount:
                      cluster
                        .activeEvidenceCount,

                    verifiedCount:
                      cluster
                        .verifiedCount,

                    sources:
                      cluster.sources,

                    relationCounts:
                      cluster
                        .relationCounts,
                  }
                : null,
          };

        }
      );


  priorities.sort(
    (a, b) => {

      if (
        b.priorityScore !==
        a.priorityScore
      ) {

        return (
          b.priorityScore -
          a.priorityScore
        );

      }


      return (
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
      );

    }
  );


  return {
    disasterId,

    algorithmVersion:
      PRIORITY_ALGORITHM_VERSION,

    count:
      priorities.length,

    priorities:
      priorities.map(
        (
          priority,
          index
        ) => ({
          rank:
            index + 1,

          ...priority,
        })
      ),
  };
}