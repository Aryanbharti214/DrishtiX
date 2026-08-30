import { Router } from "express";
import { requireRole } from "../auth/auth.middleware.js";
import { autocompleteController, directionsController, fireStationsController } from "./routing.controller.js";

export const routingRouter = Router();

routingRouter.get("/fire-stations", fireStationsController);
routingRouter.get("/autocomplete", autocompleteController);
routingRouter.post("/directions", requireRole("RESPONDER", "COMMANDER"), directionsController);
