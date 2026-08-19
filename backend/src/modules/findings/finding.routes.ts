import {
  Router,
} from "express";


import {
  createManualFindingController,
  getFindingByIdController,
  getDisasterFindingsController,
  getImageryFindingsController,
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


findingRouter.get(
  "/:id",
  getFindingByIdController
);