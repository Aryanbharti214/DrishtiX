import { Router } from "express";

import {
  createDisasterController,
  getAllDisastersController,
  getDisasterByIdController,
  updateDisasterController,
} from "./disaster.controller.js";

export const disasterRouter = Router();

disasterRouter.post(
  "/",
  createDisasterController
);

disasterRouter.get(
  "/",
  getAllDisastersController
);

disasterRouter.get(
  "/:id",
  getDisasterByIdController
);

disasterRouter.patch(
  "/:id",
  updateDisasterController
);