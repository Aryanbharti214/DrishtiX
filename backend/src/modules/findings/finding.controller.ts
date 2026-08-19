import {
  verifyFindingSchema,
} from "./finding.types.js";


import {
  getFindingVerificationHistoryService,
  verifyFindingService,
} from "./finding-verification.service.js";
import type {
  Request,
  Response,
  NextFunction,
} from "express";
import {
  createManualFindingSchema,
} from "./finding.types.js";
import { z } from "zod";

import {
  createManualFindingService,
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
export async function createManualFindingController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const parsed =
      createManualFindingSchema
        .safeParse(
          req.body
        );


    if (!parsed.success) {

      res.status(400).json({
        success: false,

        error: {
          code:
            "VALIDATION_ERROR",

          message:
            "Invalid finding data",

          details:
            parsed.error
              .flatten()
              .fieldErrors,
        },
      });


      return;
    }


    const finding =
      await createManualFindingService(
        parsed.data
      );


    res.status(201).json({
      success: true,

      data: {
        finding,
      },
    });

  } catch (error) {

    next(error);

  }
}
export async function verifyFindingController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const findingId =
      uuidSchema.safeParse(
        req.params.id
      );


    if (
      !findingId.success
    ) {

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


    const body =
      verifyFindingSchema
        .safeParse(
          req.body
        );


    if (!body.success) {

      res.status(400).json({
        success: false,

        error: {
          code:
            "VALIDATION_ERROR",

          message:
            "Invalid verification data",

          details:
            body.error
              .flatten(),
        },
      });


      return;
    }


    const result =
      await verifyFindingService(
        findingId.data,
        body.data
      );


    res.status(200).json({
      success: true,

      data:
        result,
    });

  } catch (error) {

    next(error);

  }
}


export async function getFindingVerificationHistoryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const findingId =
      uuidSchema.safeParse(
        req.params.id
      );


    if (
      !findingId.success
    ) {

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


    const history =
      await getFindingVerificationHistoryService(
        findingId.data
      );


    res.status(200).json({
      success: true,

      data: {
        history,
      },
    });

  } catch (error) {

    next(error);

  }
}