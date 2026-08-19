import {
  Router,
} from "express";


import {
  createManualFindingController,
  getFindingByIdController,
  getDisasterFindingsController,
  getImageryFindingsController,
  getFindingVerificationHistoryController,
  verifyFindingController,
} from "./finding.controller.js";


export const findingRouter =
  Router();


findingRouter.post(
  "/manual",
  createManualFindingController
);


findingRouter.get(
  "/disaster/:disasterId",
  getDisasterFindingsController
);


findingRouter.get(
  "/imagery/:imageryId",
  getImageryFindingsController
);


/*
|--------------------------------------------------------------------------
| Human verification
|--------------------------------------------------------------------------
*/

findingRouter.post(
  "/:id/verify",
  verifyFindingController
);


findingRouter.get(
  "/:id/verifications",
  getFindingVerificationHistoryController
);


findingRouter.get(
  "/:id",
  getFindingByIdController
);