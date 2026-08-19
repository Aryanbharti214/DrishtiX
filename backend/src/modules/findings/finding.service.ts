import {
  AppError,
} from "../../utils/app-error.js";


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


/*
|--------------------------------------------------------------------------
| Create responder finding
|--------------------------------------------------------------------------
*/

export async function createManualFindingService(
  input: CreateManualFindingInput
) {

  /*
   * Ensure disaster exists.
   */

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


  /*
   * Imagery is optional.
   *
   * If supplied, make sure that image
   * actually belongs to this disaster.
   */

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


  return createManualFinding(
    input
  );
}