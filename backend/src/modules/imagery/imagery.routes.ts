import {
  Router,
} from "express";

import {
  uploadImagery,
} from "./imagery.upload.js";

import {
  uploadImageryController,
  getImageryByIdController,
  getDisasterImageryController,
  analyzeImageryController,
} from "./imagery.controller.js";


export const imageryRouter =
  Router();


imageryRouter.post(
  "/",
  uploadImagery.single(
    "image"
  ),
  uploadImageryController
);


imageryRouter.post(
  "/:id/analyze",
  analyzeImageryController
);


imageryRouter.get(
  "/:id",
  getImageryByIdController
);


imageryRouter.get(
  "/disaster/:disasterId",
  getDisasterImageryController
);