import { Router } from "express";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    service: "DrishtiX Backend",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});