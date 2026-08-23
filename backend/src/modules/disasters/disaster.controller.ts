import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  createDisasterSchema,
  bulkDeleteDisastersSchema,
  updateDisasterSchema,
  disasterIdSchema,
} from "./disaster.types.js";

import {
  createDisasterService,
  bulkDeleteDisastersService,
  getAllDisastersService,
  getDisasterByIdService,
  updateDisasterService,
} from "./disaster.service.js";

export async function bulkDeleteDisastersController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = bulkDeleteDisastersSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Provide between 1 and 100 valid disaster IDs",
        },
      });
      return;
    }

    const result = await bulkDeleteDisastersService(parsed.data.ids);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function createDisasterController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed =
      createDisasterSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details:
            parsed.error.flatten().fieldErrors,
        },
      });

      return;
    }

    const disaster =
      await createDisasterService(parsed.data);

    res.status(201).json({
      success: true,
      data: {
        disaster,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllDisastersController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const disasters =
      await getAllDisastersService();

    res.status(200).json({
      success: true,
      data: {
        disasters,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getDisasterByIdController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed =
      disasterIdSchema.safeParse(
        req.params.id
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

    const disaster =
      await getDisasterByIdService(
        parsed.data
      );

    res.status(200).json({
      success: true,
      data: {
        disaster,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDisasterController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const idResult =
      disasterIdSchema.safeParse(
        req.params.id
      );

    if (!idResult.success) {
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

    const bodyResult =
      updateDisasterSchema.safeParse(
        req.body
      );

    if (!bodyResult.success) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid request body",
          details:
            bodyResult.error.flatten(),
        },
      });

      return;
    }

    const disaster =
      await updateDisasterService(
        idResult.data,
        bodyResult.data
      );

    res.status(200).json({
      success: true,
      data: {
        disaster,
      },
    });
  } catch (error) {
    next(error);
  }
}
