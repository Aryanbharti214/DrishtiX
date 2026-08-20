import type {
  Request,
  Response,
  NextFunction,
} from "express";


import {
  z,
} from "zod";


import {
  getEvidenceClustersService,
} from "./evidence-cluster.service.js";


const uuidSchema =
  z.string().uuid();


export async function getEvidenceClustersController(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const disasterId =
      uuidSchema.safeParse(
        req.params.disasterId
      );


    if (
      !disasterId.success
    ) {

      res.status(
        400
      ).json({
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


    const result =
      await getEvidenceClustersService(
        disasterId.data
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