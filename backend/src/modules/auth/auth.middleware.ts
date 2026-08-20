import type {
  Request,
  Response,
  NextFunction,
} from "express";

import {
  AppError,
} from "../../utils/app-error.js";

import {
  verifySessionToken,
} from "./auth.service.js";

import type {
  AuthRole,
} from "./auth.service.js";


export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {

  try {

    const authorization =
      req.header(
        "authorization"
      );


    if (
      !authorization
        ?.startsWith(
          "Bearer "
        )
    ) {

      throw new AppError(
        401,
        "AUTH_REQUIRED",
        "Authentication required"
      );

    }


    const token =
      authorization
        .slice(
          "Bearer ".length
        )
        .trim();


    const session =
      verifySessionToken(
        token
      );


    res.locals.auth =
      session;


    next();

  } catch (error) {

    next(error);

  }
}


export function requireRole(
  ...allowedRoles:
    AuthRole[]
) {

  return function roleMiddleware(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {

    const session =
      res.locals.auth;


    if (
      !session
    ) {

      next(
        new AppError(
          401,
          "AUTH_REQUIRED",
          "Authentication required"
        )
      );

      return;
    }


    if (
      !allowedRoles.includes(
        session.role
      )
    ) {

      next(
        new AppError(
          403,
          "FORBIDDEN",
          "You do not have permission to perform this action"
        )
      );

      return;
    }


    next();

  };
}