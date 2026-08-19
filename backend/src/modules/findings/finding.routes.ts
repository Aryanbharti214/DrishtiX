import {
  Router,
} from "express";
import {
  correlateFindingController,
  getFindingRelationsController,
} from "./finding-correlation.controller.js";
import {
  getEvidenceClustersController,
} from "./evidence-cluster.controller.js";
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
  "/disaster/:disasterId/clusters",
  getEvidenceClustersController
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
/*
|--------------------------------------------------------------------------
| Spatial evidence correlation
|--------------------------------------------------------------------------
*/

findingRouter.post(
  "/:id/correlate",
  correlateFindingController
);


findingRouter.get(
  "/:id/relations",
  getFindingRelationsController
);

findingRouter.get(
  "/:id",
  getFindingByIdController
);