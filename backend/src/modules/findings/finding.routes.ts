import {
  Router,
} from "express";


import {
  requireRole,
} from "../auth/auth.middleware.js";


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
  getDisasterFindingsController,
  getFindingByIdController,
  getFindingVerificationHistoryController,
  getImageryFindingsController,
  verifyFindingController,
} from "./finding.controller.js";


import {
  generateFusionRecommendationController,
  getFusionRecommendationsController,
  reviewFusionRecommendationController,
} from "./fusion-recommendation.controller.js";


export const findingRouter =
  Router();


/*
|--------------------------------------------------------------------------
| Manual responder finding
|--------------------------------------------------------------------------
|
| VIEWER     ❌
| RESPONDER  ✅
| COMMANDER  ✅
|--------------------------------------------------------------------------
*/

findingRouter.post(
  "/manual",

  requireRole(
    "RESPONDER",
    "COMMANDER"
  ),

  createManualFindingController
);


/*
|--------------------------------------------------------------------------
| Disaster-level read APIs
|--------------------------------------------------------------------------
|
| All authenticated roles.
|--------------------------------------------------------------------------
*/

findingRouter.get(
  "/disaster/:disasterId",
  getDisasterFindingsController
);


findingRouter.get(
  "/disaster/:disasterId/clusters",
  getEvidenceClustersController
);


findingRouter.get(
  "/disaster/:disasterId/priorities",
  getDisasterPrioritiesController
);


findingRouter.get(
  "/disaster/:disasterId/fusion-recommendations",
  getFusionRecommendationsController
);




findingRouter.post(
  "/disaster/:disasterId/clusters/:anchorFindingId/fusion-recommendation",

  requireRole(
    "COMMANDER"
  ),

  generateFusionRecommendationController
);



findingRouter.post(
  "/fusion-recommendations/:id/review",

  requireRole(
    "COMMANDER"
  ),

  reviewFusionRecommendationController
);



findingRouter.get(
  "/imagery/:imageryId",
  getImageryFindingsController
);



findingRouter.post(
  "/:id/verify",

  requireRole(
    "COMMANDER"
  ),

  verifyFindingController
);

findingRouter.get(
  "/:id/verifications",
  getFindingVerificationHistoryController
);




findingRouter.post(
  "/:id/correlate",

  requireRole(
    "RESPONDER",
    "COMMANDER"
  ),

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