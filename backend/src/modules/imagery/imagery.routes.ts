import {
  Router,
} from "express";


import {
  requireRole,
} from "../auth/auth.middleware.js";


import {
  uploadImagery,
} from "./imagery.upload.js";


import {
  analyzeImageryController,
  getDisasterImageryController,
  getImageryAnalysisController,
  getImageryByIdController,
  uploadImageryController,
} from "./imagery.controller.js";


export const imageryRouter =
  Router();



imageryRouter.post(
  "/",

  requireRole(
    "RESPONDER",
    "COMMANDER"
  ),

  uploadImagery.single(
    "image"
  ),

  uploadImageryController
);



imageryRouter.post(
  "/:id/analyze",

  requireRole(
    "RESPONDER",
    "COMMANDER"
  ),

  analyzeImageryController
);




imageryRouter.get(
  "/disaster/:disasterId",
  getDisasterImageryController
);
imageryRouter.get(
  "/:id/analysis",
  getImageryAnalysisController
);

imageryRouter.get(
  "/:id",
  getImageryByIdController
);