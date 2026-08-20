import {
  Router,
} from "express";

import {
  getSessionController,
  loginController,
} from "./auth.controller.js";

import {
  requireAuth,
} from "./auth.middleware.js";


export const authRouter =
  Router();


authRouter.post(
  "/login",
  loginController
);


authRouter.get(
  "/session",
  requireAuth,
  getSessionController
);