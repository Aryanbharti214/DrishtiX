import type {
  Request,
  Response,
  NextFunction,
} from "express";


import {
  z,
} from "zod";


import {
  correlateFindingService,
  getFindingRelationsService,
} from "./finding-correlation.service.js";


const uuidSchema =
  z.string().uuid();


export async function correlateFindingController(
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

      res.status(
        400
      ).json({
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


    const result =
      await correlateFindingService(
        findingId.data
      );


    res.status(
      200
    ).json({
      success: true,

      data:
        result,
    });

  } catch (error) {

    next(error);

  }
}


export async function getFindingRelationsController(
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

      res.status(
        400
      ).json({
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


    const relations =
      await getFindingRelationsService(
        findingId.data
      );


    res.status(
      200
    ).json({
      success: true,

      data: {
        relations,
      },
    });

  } catch (error) {

    next(error);

  }
}