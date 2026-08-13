import type {
  Request,
  Response,
  NextFunction,
} from "express";

import { z } from "zod";

import {
  getFindingByIdService,
  getFindingsByDisasterService,
  getFindingsByImageryService,
} from "./finding.service.js";

const uuidSchema =
  z.string().uuid();

export async function getFindingByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const id =
      uuidSchema.safeParse(
        req.params.id
      );

    if (!id.success) {
      res.status(400).json({
        success: false,

        error: {
          code:
            "INVALID_FINDING_ID",

          message:
            "Finding ID must be a valid UUID",
        },
      });

      return;
    }

    const finding =
      await getFindingByIdService(
        id.data
      );

    res.json({
      success: true,

      data: {
        finding,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDisasterFindingsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const disasterId =
      uuidSchema.safeParse(
        req.params.disasterId
      );

    if (!disasterId.success) {
      res.status(400).json({
        success: false,
        error: {
          code:
            "INVALID_DISASTER_ID",

          message:
            "Disaster ID must be a valid UUID",
        },
      });

      return;
    }

    const findings =
      await getFindingsByDisasterService(
        disasterId.data
      );

    res.json({
      success: true,

      data: {
        findings,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getImageryFindingsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const imageryId =
      uuidSchema.safeParse(
        req.params.imageryId
      );

    if (!imageryId.success) {
      res.status(400).json({
        success: false,
        error: {
          code:
            "INVALID_IMAGERY_ID",

          message:
            "Imagery ID must be a valid UUID",
        },
      });

      return;
    }

    const findings =
      await getFindingsByImageryService(
        imageryId.data
      );

    res.json({
      success: true,

      data: {
        findings,
      },
    });
  } catch (error) {
    next(error);
  }
}