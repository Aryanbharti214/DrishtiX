import {
  Router,
} from "express";
import {
  getDisasterPrioritiesController,
} from "./finding-priority.controller.js";
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

import {
  generateFusionRecommendationController,
  getFusionRecommendationsController,
  reviewFusionRecommendationController,
} from "./fusion-recommendation.controller.js";
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
/*
|--------------------------------------------------------------------------
| Fusion recommendations
|--------------------------------------------------------------------------
*/
findingRouter.get(
  "/disaster/:disasterId/priorities",
  getDisasterPrioritiesController
);

findingRouter.post(
  "/disaster/:disasterId/clusters/:anchorFindingId/fusion-recommendation",
  generateFusionRecommendationController
);


findingRouter.get(
  "/disaster/:disasterId/fusion-recommendations",
  getFusionRecommendationsController
);


findingRouter.post(
  "/fusion-recommendations/:id/review",
  reviewFusionRecommendationController
);
findingRouter.get(
  "/:id",
  getFindingByIdController
);