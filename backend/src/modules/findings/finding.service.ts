import {
  findFindingById,
  findFindingsByDisaster,
  findFindingsByImagery,
} from "./finding.repository.js";

import { AppError } from "../../utils/app-error.js";

export async function getFindingByIdService(
  id: string
) {
  const finding =
    await findFindingById(id);

  if (!finding) {
    throw new AppError(
      404,
      "FINDING_NOT_FOUND",
      "Finding not found"
    );
  }

  return finding;
}

export async function getFindingsByDisasterService(
  disasterId: string
) {
  return findFindingsByDisaster(
    disasterId
  );
}

export async function getFindingsByImageryService(
  imageryId: string
) {
  return findFindingsByImagery(
    imageryId
  );
}