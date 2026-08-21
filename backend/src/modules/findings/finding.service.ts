import {
  AppError,
} from "../../utils/app-error.js";
import {
  refreshFindingCorrelationBestEffort,
} from "./finding-correlation.service.js";

import {
  findDisasterById,
} from "../disasters/disaster.repository.js";


import {
  findImageryById,
} from "../imagery/imagery.repository.js";


import {
  createManualFinding,
  findFindingById,
  findFindingsByDisaster,
  findFindingsByImagery,
} from "./finding.repository.js";


import type {
  CreateManualFindingInput,
} from "./finding.types.js";


export async function getFindingByIdService(
  id: string
) {
  const finding =
    await findFindingById(
      id
    );


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



export async function createManualFindingService(
  input: CreateManualFindingInput
) {

  

  const disaster =
    await findDisasterById(
      input.disasterId
    );


  if (!disaster) {
    throw new AppError(
      404,
      "DISASTER_NOT_FOUND",
      "Disaster not found"
    );
  }


  

  if (input.imageryId) {

    const imagery =
      await findImageryById(
        input.imageryId
      );


    if (!imagery) {
      throw new AppError(
        404,
        "IMAGERY_NOT_FOUND",
        "Imagery not found"
      );
    }


    if (
      imagery.disasterId !==
      input.disasterId
    ) {
      throw new AppError(
        400,
        "IMAGERY_DISASTER_MISMATCH",
        "Imagery does not belong to the selected disaster"
      );
    }
  }


  const finding =
  await createManualFinding(
    input
  );


await refreshFindingCorrelationBestEffort(
  finding.id
);


return finding;
}