import {
  AppError,
} from "../../utils/app-error.js";

import {
  findFindingById,
} from "./finding.repository.js";

import {
  findVerificationHistory,
  verifyFindingTransaction,
} from "./finding-verification.repository.js";

import type {
  VerifyFindingInput,
} from "./finding.types.js";


export async function verifyFindingService(
  findingId: string,
  input: VerifyFindingInput
) {

  const result =
    await verifyFindingTransaction(
      findingId,
      input
    );


  if (!result) {

    throw new AppError(
      404,
      "FINDING_NOT_FOUND",
      "Finding not found"
    );

  }


  /*
   * Read using our normal finding
   * mapper after transaction commits.
   */

  const finding =
    await findFindingById(
      findingId
    );


  if (!finding) {

    throw new AppError(
      404,
      "FINDING_NOT_FOUND",
      "Finding not found after verification"
    );

  }


  return {
    finding,

    verification:
      result.verification,
  };
}


export async function getFindingVerificationHistoryService(
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


  return findVerificationHistory(
    findingId
  );
}