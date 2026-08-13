import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { notFoundHandler } from "./middleware/not-found.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";

export const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: env.CORS_ORIGIN,
  })
);

app.use(
  express.json({
    limit: "1mb",
  })
);

app.use(pinoHttp());

app.use("/api/v1", apiRouter);

app.use(notFoundHandler);

app.use(errorHandler);