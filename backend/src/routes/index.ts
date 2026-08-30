import { Router } from "express";

import { checkDatabaseConnection } from "../config/database.js";
import { checkAIServiceHealth } from "../integrations/ai/ai.client.js";
import { disasterRouter } from "../modules/disasters/disaster.routes.js";
import {imageryRouter,} from "../modules/imagery/imagery.routes.js";
import {findingRouter,} from "../modules/findings/finding.routes.js";
import { routingRouter } from "../modules/routing/routing.routes.js";
import {
  authRouter,
} from "../modules/auth/auth.routes.js";

import {
  requireAuth,
} from "../modules/auth/auth.middleware.js";
export const apiRouter = Router();

apiRouter.get("/health", async (_req, res, next) => {
  try {
    const [database, ai] = await Promise.all([
      checkDatabaseConnection(),
      checkAIServiceHealth(),
    ]);

    res.status(200).json({
      success: true,

      service: "DrishtiX Backend",

      status: "healthy",

      services: {
        api: "healthy",
        database: "healthy",
        ai: ai.status,
      },

      databaseTime: database.current_time,

      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.use(
  "/auth",
  authRouter
);


apiRouter.use(
  requireAuth
);
apiRouter.use(
  "/disasters",
  disasterRouter
);

apiRouter.use(
  "/imagery",
  imageryRouter
);

apiRouter.use(
  "/findings",
  findingRouter
);

apiRouter.use(
  "/routing",
  routingRouter
);
