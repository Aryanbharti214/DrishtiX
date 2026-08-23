import type {
  Request,
  Response,
  NextFunction,
} from "express";
import {
  analyzeImageryService,
  getImageryAnalysisService,
} from "./imagery-analysis.service.js";

import {
  createImageryMetadataSchema,
  bulkDeleteImagerySchema,
  imageryIdSchema,
} from "./imagery.types.js";

import {
  createImageryService,
  bulkDeleteImageryService,
  getImageryByIdService,
  getDisasterImageryService,
} from "./imagery.service.js";

export async function bulkDeleteImageryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = bulkDeleteImagerySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Provide between 1 and 100 valid imagery IDs",
        },
      });
      return;
    }

    const result = await bulkDeleteImageryService(parsed.data.ids);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function uploadImageryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,

        error: {
          code: "IMAGE_REQUIRED",
          message:
            "An image file is required",
        },
      });

      return;
    }

    const parsed =
      createImageryMetadataSchema.safeParse(
        req.body
      );

    if (!parsed.success) {
      res.status(400).json({
        success: false,

        error: {
          code: "VALIDATION_ERROR",

          message:
            "Invalid imagery metadata",

          details:
            parsed.error.flatten(),
        },
      });

      return;
    }

    const imagery =
      await createImageryService(
        parsed.data,
        req.file
      );

    res.status(201).json({
      success: true,

      data: {
        imagery,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getImageryByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed =
      imageryIdSchema.safeParse(
        req.params.id
      );

    if (!parsed.success) {
      res.status(400).json({
        success: false,

        error: {
          code: "INVALID_IMAGERY_ID",
          message:
            "Imagery ID must be a valid UUID",
        },
      });

      return;
    }

    const imagery =
      await getImageryByIdService(
        parsed.data
      );

    res.status(200).json({
      success: true,

      data: {
        imagery,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDisasterImageryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed =
      imageryIdSchema.safeParse(
        req.params.disasterId
      );

    if (!parsed.success) {
      res.status(400).json({
        success: false,

        error: {
          code: "INVALID_DISASTER_ID",
          message:
            "Disaster ID must be a valid UUID",
        },
      });

      return;
    }

    const imagery =
      await getDisasterImageryService(
        parsed.data
      );

    res.status(200).json({
      success: true,

      data: {
        imagery,
      },
    });
  } catch (error) {
    next(error);
  }
}
export async function analyzeImageryController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {

    const parsed =
      imageryIdSchema.safeParse(
        req.params.id
      );


    if (!parsed.success) {

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


    const result =
      await analyzeImageryService(
        parsed.data
      );


    res.status(200).json({
      success: true,

      data:
        result,
    });

  } catch (error) {

    next(error);

  }
}export async function getImageryAnalysisController(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const parsed =
      imageryIdSchema.safeParse(
        req.params.id
      );


    if (
      !parsed.success
    ) {

      res.status(
        400
      ).json({
        success:
          false,

        error: {
          code:
            "INVALID_IMAGERY_ID",

          message:
            "Imagery ID must be a valid UUID",
        },
      });


      return;
    }


    const analysis =
      await getImageryAnalysisService(
        parsed.data
      );


    res.status(
      200
    ).json({
      success:
        true,

      data: {
        analysis,
      },
    });

  } catch (error) {

    next(
      error
    );

  }
}
