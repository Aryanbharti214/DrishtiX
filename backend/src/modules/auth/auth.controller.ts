import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  z,
} from "zod";

import {
  authenticateOfficer,
  verifySessionToken,
} from "./auth.service.js";


const loginSchema =
  z.object({
    agencyId:
      z.string()
        .min(1),

    password:
      z.string()
        .min(1),
  });


export function loginController(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const credentials =
      loginSchema.parse(
        req.body
      );


    const session =
      authenticateOfficer(
        credentials.agencyId,
        credentials.password
      );


    res.status(
      200
    ).json({
      success: true,

      data:
        session,
    });

  } catch (error) {

    next(error);

  }
}


export function getSessionController(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const token =
      req
        .header(
          "authorization"
        )!
        .slice(
          "Bearer ".length
        )
        .trim();


    const session =
      verifySessionToken(
        token
      );


    res.status(
      200
    ).json({
      success: true,

      data: {
        authenticated:
          true,

        user: {
          agencyId:
            session.sub,

          role:
            session.role,
        },
      },
    });

  } catch (error) {

    next(error);

  }
}