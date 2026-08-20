import type {
  Request,
  Response,
  NextFunction,
} from "express";


import {
  z,
} from "zod";


import {
  reviewFusionRecommendationSchema,
} from "./fusion-recommendation.types.js";


import {
  generateFusionRecommendationService,
  getFusionRecommendationsService,
  reviewFusionRecommendationService,
} from "./fusion-recommendation.service.js";


const uuidSchema =
  z.string().uuid();


export async function generateFusionRecommendationController(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const disasterId =
      uuidSchema.safeParse(
        req.params.disasterId
      );


    const anchorFindingId =
      uuidSchema.safeParse(
        req.params.anchorFindingId
      );


    if (
      !disasterId.success ||
      !anchorFindingId.success
    ) {

      res.status(
        400
      ).json({
        success: false,

        error: {
          code:
            "INVALID_FUSION_REQUEST",

          message:
            "Disaster ID and anchor finding ID must be valid UUIDs",
        },
      });


      return;
    }


    const result =
      await generateFusionRecommendationService(
        disasterId.data,
        anchorFindingId.data
      );


    res.status(
      result.created
        ? 201
        : 200
    ).json({
      success: true,

      data:
        result,
    });

  } catch (error) {

    next(error);

  }
}


export async function getFusionRecommendationsController(
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


    const recommendations =
      await getFusionRecommendationsService(
        disasterId.data
      );


    res.status(
      200
    ).json({
      success: true,

      data: {
        recommendations,
      },
    });

  } catch (error) {

    next(error);

  }
}


export async function reviewFusionRecommendationController(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const recommendationId =
      uuidSchema.safeParse(
        req.params.id
      );


    if (
      !recommendationId.success
    ) {

      res.status(
        400
      ).json({
        success: false,

        error: {
          code:
            "INVALID_FUSION_RECOMMENDATION_ID",

          message:
            "Fusion recommendation ID must be a valid UUID",
        },
      });


      return;
    }


    const parsed =
      reviewFusionRecommendationSchema
        .safeParse(
          req.body
        );


    if (!parsed.success) {

      res.status(
        400
      ).json({
        success: false,

        error: {
          code:
            "INVALID_FUSION_REVIEW",

          message:
            "Invalid fusion review request",

          details:
            parsed.error.flatten(),
        },
      });


      return;
    }


    const result =
      await reviewFusionRecommendationService(
        recommendationId.data,
        parsed.data
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
