import {
  AppError,
} from "../../utils/app-error.js";


import {
  findDisasterById,
} from "../disasters/disaster.repository.js";


import {
  findClusterFindingsByDisaster,
  findClusterRelationsByDisaster,
} from "./evidence-cluster.repository.js";


import type {
  ClusterFinding,
  ClusterRelation,
  EvidenceCluster,
  EvidenceClusterState,
} from "./evidence-cluster.types.js";


const CLUSTER_ALGORITHM_VERSION =
  "evidence-cluster-v1";


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


class DisjointSet {

  private parent =
    new Map<
      string,
      string
    >();


  constructor(
    ids: string[]
  ) {

    for (
      const id
      of ids
    ) {

      this.parent.set(
        id,
        id
      );

    }

  }


  find(
    id: string
  ): string {

    const parent =
      this.parent.get(
        id
      );


    if (!parent) {

      throw new Error(
        `Unknown finding ${id}`
      );

    }


    if (
      parent === id
    ) {
      return id;
    }


    const root =
      this.find(
        parent
      );


    this.parent.set(
      id,
      root
    );


    return root;
  }


  union(
    a: string,
    b: string
  ) {

    const rootA =
      this.find(
        a
      );


    const rootB =
      this.find(
        b
      );


    if (
      rootA === rootB
    ) {
      return;
    }


    /*
     * Deterministic parent:
     * smallest UUID string wins.
     */

    if (
      rootA < rootB
    ) {

      this.parent.set(
        rootB,
        rootA
      );

    } else {

      this.parent.set(
        rootA,
        rootB
      );

    }

  }
}


function shouldConnectCluster(
  relation:
    ClusterRelation
) {

  switch (
    relation.relationType
  ) {

    case "CORROBORATES":

    case "POSSIBLE_DUPLICATE":

    case "DISPUTED":
      return true;


    case "RELATED":
      /*
       * Avoid extremely loose
       * 250m edges creating huge
       * chain-connected clusters.
       */
      return (
        relation.distanceMeters <=
        150
      );


    default:
      return false;
  }
}


function getHighestSeverity(
  findings:
    ClusterFinding[]
) {

  let highest:
    string | null =
    null;


  for (
    const finding
    of findings
  ) {

    if (
      !finding.severity
    ) {
      continue;
    }


    if (
      !highest ||
      (
        severityRank[
          finding.severity
        ] ?? 0
      ) >
      (
        severityRank[
          highest
        ] ?? 0
      )
    ) {

      highest =
        finding.severity;

    }

  }


  return highest;
}


function getDisplayCenter(
  findings:
    ClusterFinding[]
) {

  const located =
    findings.filter(
      (finding) =>
        finding.latitude !==
          null &&
        finding.longitude !==
          null
    );


  if (
    located.length === 0
  ) {

    return {
      latitude:
        null,

      longitude:
        null,
    };

  }


  const latitude =
    located.reduce(
      (
        total,
        finding
      ) =>
        total +
        Number(
          finding.latitude
        ),
      0
    ) /
    located.length;


  const longitude =
    located.reduce(
      (
        total,
        finding
      ) =>
        total +
        Number(
          finding.longitude
        ),
      0
    ) /
    located.length;


  return {
    latitude,

    longitude,
  };
}


function getClusterState(
  relations:
    ClusterRelation[]
):
  EvidenceClusterState {

  if (
    relations.some(
      (relation) =>
        relation.relationType ===
        "DISPUTED"
    )
  ) {

    return "DISPUTED";

  }


  if (
    relations.some(
      (relation) =>
        relation.relationType ===
        "CORROBORATES"
    )
  ) {

    return "CORROBORATED";

  }


  if (
    relations.length > 0
  ) {

    return "RELATED";

  }


  return "ISOLATED";
}


export async function getEvidenceClustersService(
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


  const [
    findings,
    relations,
  ] =
    await Promise.all([
      findClusterFindingsByDisaster(
        disasterId
      ),

      findClusterRelationsByDisaster(
        disasterId
      ),
    ]);


  const findingIds =
    new Set(
      findings.map(
        (finding) =>
          finding.id
      )
    );


  const disjointSet =
    new DisjointSet(
      [
        ...findingIds,
      ]
    );


  for (
    const relation
    of relations
  ) {

    if (
      !findingIds.has(
        relation.findingAId
      )
      ||
      !findingIds.has(
        relation.findingBId
      )
    ) {
      continue;
    }


    if (
      shouldConnectCluster(
        relation
      )
    ) {

      disjointSet.union(
        relation.findingAId,
        relation.findingBId
      );

    }

  }


  const grouped =
    new Map<
      string,
      ClusterFinding[]
    >();


  for (
    const finding
    of findings
  ) {

    const root =
      disjointSet.find(
        finding.id
      );


    const existing =
      grouped.get(
        root
      ) ?? [];


    existing.push(
      finding
    );


    grouped.set(
      root,
      existing
    );

  }


  const clusters:
    EvidenceCluster[] =
    [];


  for (
    const members
    of grouped.values()
  ) {

    const memberIds =
      new Set(
        members.map(
          (member) =>
            member.id
        )
      );


    const clusterRelations =
      relations.filter(
        (relation) =>
          memberIds.has(
            relation.findingAId
          )
          &&
          memberIds.has(
            relation.findingBId
          )
      );


    const sortedMembers =
      [
        ...members,
      ].sort(
        (a, b) =>
          a.id.localeCompare(
            b.id
          )
      );


    const anchorFindingId =
      sortedMembers[0]!.id;


    const corroborates =
      clusterRelations.filter(
        (relation) =>
          relation.relationType ===
          "CORROBORATES"
      ).length;


    const related =
      clusterRelations.filter(
        (relation) =>
          relation.relationType ===
          "RELATED"
      ).length;


    const possibleDuplicates =
      clusterRelations.filter(
        (relation) =>
          relation.relationType ===
          "POSSIBLE_DUPLICATE"
      ).length;


    const disputed =
      clusterRelations.filter(
        (relation) =>
          relation.relationType ===
          "DISPUTED"
      ).length;


    const activeEvidence =
      members.filter(
        (member) =>
          member.verificationStatus !==
          "REJECTED"
      );


    clusters.push({
      clusterId:
        `${CLUSTER_ALGORITHM_VERSION}:${anchorFindingId}`,

      anchorFindingId,

      state:
        getClusterState(
          clusterRelations
        ),

      memberCount:
        members.length,

      activeEvidenceCount:
        activeEvidence.length,

      verifiedCount:
        members.filter(
          (member) =>
            member.verificationStatus ===
              "CONFIRMED"
            ||
            member.verificationStatus ===
              "CORRECTED"
        ).length,

      pendingCount:
        members.filter(
          (member) =>
            member.verificationStatus ===
            "PENDING"
        ).length,

      rejectedCount:
        members.filter(
          (member) =>
            member.verificationStatus ===
            "REJECTED"
        ).length,

      sources:
        [
          ...new Set(
            activeEvidence.map(
              (member) =>
                member.source
            )
          ),
        ],

      findingTypes:
        [
          ...new Set(
            activeEvidence.map(
              (member) =>
                member.type
            )
          ),
        ],

      highestSeverity:
        getHighestSeverity(
          activeEvidence
        ),

      relationCounts: {
        corroborates,

        related,

        possibleDuplicates,

        disputed,
      },

      displayCenter:
        getDisplayCenter(
          activeEvidence.length
            ? activeEvidence
            : members
        ),

      members:
        sortedMembers,

      relations:
        clusterRelations,
    });

  }


  clusters.sort(
    (a, b) => {

      if (
        a.state ===
          "DISPUTED"
        &&
        b.state !==
          "DISPUTED"
      ) {
        return -1;
      }


      if (
        b.state ===
          "DISPUTED"
        &&
        a.state !==
          "DISPUTED"
      ) {
        return 1;
      }


      return (
        b.activeEvidenceCount -
        a.activeEvidenceCount
      );

    }
  );


  return {
    disasterId,

    algorithmVersion:
      CLUSTER_ALGORITHM_VERSION,

    clusterCount:
      clusters.length,

    clusters,
  };
}