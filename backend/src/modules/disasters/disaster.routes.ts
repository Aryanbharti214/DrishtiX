import { Router } from "express";
import {
  requireRole,
} from "../auth/auth.middleware.js";
import {
  createDisasterController,
  bulkDeleteDisastersController,
  getAllDisastersController,
  getDisasterByIdController,
  updateDisasterController,
} from "./disaster.controller.js";

export const disasterRouter = Router();

disasterRouter.delete(
  "/bulk",
  requireRole("COMMANDER"),
  bulkDeleteDisastersController
);

disasterRouter.post(
  "/",
  requireRole(
    "COMMANDER"
  ),
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
  requireRole(
    "COMMANDER"
  ),
  updateDisasterController
);
