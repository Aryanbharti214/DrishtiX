export const findingRelationTypes = [
  "CORROBORATES",
  "RELATED",
  "POSSIBLE_DUPLICATE",
  "DISPUTED",
] as const;


export type FindingRelationType =
  typeof findingRelationTypes[number];


export interface CorrelationFinding {
  id: string;

  disasterId: string;

  type: string;

  source: string;

  severity:
    string | null;

  verificationStatus:
    string;

  imageryId:
    string | null;

  aiRunId:
    string | null;

  latitude:
    number | null;

  longitude:
    number | null;

  createdAt:
    Date;

  distanceMeters:
    number;

  temporalGapMinutes:
    number;
}


export interface ComputedFindingRelation {
  disasterId: string;

  findingAId: string;

  findingBId: string;

  relationType:
    FindingRelationType;

  distanceMeters:
    number;

  score:
    number;

  signals:
    Record<
      string,
      unknown
    >;

  algorithmVersion:
    string;
}