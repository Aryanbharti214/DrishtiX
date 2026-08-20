export interface ClusterFinding {
  id: string;

  disasterId: string;

  type: string;

  severity:
    string | null;

  source: string;

  verificationStatus:
    string;

  title:
    string | null;

  description:
    string | null;

  latitude:
    number | null;

  longitude:
    number | null;

  createdAt:
    Date;
}


export interface ClusterRelation {
  id: string;

  findingAId: string;

  findingBId: string;

  relationType:
    string;

  distanceMeters:
    number;

  score:
    number;
}


export type EvidenceClusterState =
  | "ISOLATED"
  | "RELATED"
  | "CORROBORATED"
  | "DISPUTED";


export interface EvidenceCluster {
  clusterId: string;

  anchorFindingId: string;

  state:
    EvidenceClusterState;

  memberCount: number;

  activeEvidenceCount:
    number;

  verifiedCount:
    number;

  pendingCount:
    number;

  rejectedCount:
    number;

  sources: string[];

  findingTypes: string[];

  highestSeverity:
    string | null;

  relationCounts: {
    corroborates: number;

    related: number;

    possibleDuplicates:
      number;

    disputed: number;
  };

  displayCenter: {
    latitude:
      number | null;

    longitude:
      number | null;
  };

  members:
    ClusterFinding[];

  relations:
    ClusterRelation[];
}