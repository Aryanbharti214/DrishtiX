import { Router } from "express";

import {
  getFindingByIdController,
  getDisasterFindingsController,
  getImageryFindingsController,
} from "./finding.controller.js";

export const findingRouter =
  Router();

findingRouter.get(
  "/:id",
  getFindingByIdController
);

findingRouter.get(
  "/disaster/:disasterId",
  getDisasterFindingsController
);

findingRouter.get(
  "/imagery/:imageryId",
  getImageryFindingsController
);