import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";


import {
  env,
} from "../../config/env.js";


import {
  AppError,
} from "../../utils/app-error.js";




export const AUTH_ROLES = [
  "VIEWER",
  "RESPONDER",
  "COMMANDER",
] as const;


export type AuthRole =
  typeof AUTH_ROLES[number];




export interface SessionPayload {
  sub: string;

  role:
    AuthRole;

  exp:
    number;
}


const TOKEN_TTL_SECONDS =
  8 * 60 * 60;




const accounts: Array<{
  agencyId: string;

  password: string;

  role: AuthRole;
}> = [

  {
    agencyId:
      env.VIEWER_AGENCY_ID,

    password:
      env.VIEWER_PASSWORD,

    role:
      "VIEWER",
  },


  {
    agencyId:
      env.RESPONDER_AGENCY_ID,

    password:
      env.RESPONDER_PASSWORD,

    role:
      "RESPONDER",
  },


  {
    agencyId:
      env.COMMANDER_AGENCY_ID,

    password:
      env.COMMANDER_PASSWORD,

    role:
      "COMMANDER",
  },

];



function safeEqual(
  firstValue: string,
  secondValue: string
) {

  const first =
    Buffer.from(
      firstValue,
      "utf8"
    );


  const second =
    Buffer.from(
      secondValue,
      "utf8"
    );


  if (
    first.length !==
    second.length
  ) {

    return false;

  }


  return timingSafeEqual(
    first,
    second
  );
}


/*
|--------------------------------------------------------------------------
| Encoding
|--------------------------------------------------------------------------
*/

function encodePayload(
  payload:
    SessionPayload
) {

  return Buffer
    .from(
      JSON.stringify(
        payload
      ),
      "utf8"
    )
    .toString(
      "base64url"
    );
}


function decodePayload(
  encodedPayload: string
):
  unknown {

  const json =
    Buffer
      .from(
        encodedPayload,
        "base64url"
      )
      .toString(
        "utf8"
      );


  return JSON.parse(
    json
  );
}


/*
|--------------------------------------------------------------------------
| Signature
|--------------------------------------------------------------------------
*/

function signPayload(
  encodedPayload: string
) {

  return createHmac(
    "sha256",
    env.AUTH_TOKEN_SECRET
  )
    .update(
      encodedPayload
    )
    .digest(
      "base64url"
    );
}




function createSessionToken(
  agencyId: string,
  role: AuthRole
) {

  const payload:
    SessionPayload = {

      sub:
        agencyId,

      role,

      exp:
        Math.floor(
          Date.now() /
          1000
        ) +
        TOKEN_TTL_SECONDS,

  };


  const encodedPayload =
    encodePayload(
      payload
    );


  const signature =
    signPayload(
      encodedPayload
    );


  return (
    `${encodedPayload}.${signature}`
  );
}


export function authenticateOfficer(
  agencyId: string,
  password: string
) {

  const normalizedAgencyId =
    agencyId.trim();


  const account =
    accounts.find(
      (
        candidate
      ) => {

        const agencyMatches =
          safeEqual(
            normalizedAgencyId,
            candidate.agencyId
          );


        const passwordMatches =
          safeEqual(
            password,
            candidate.password
          );


        return (
          agencyMatches &&
          passwordMatches
        );

      }
    );


  if (
    !account
  ) {

    throw new AppError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid officer ID or access key"
    );

  }


  const token =
    createSessionToken(
      account.agencyId,
      account.role
    );


  return {

    token,

    expiresInSeconds:
      TOKEN_TTL_SECONDS,

    user: {

      agencyId:
        account.agencyId,

      role:
        account.role,

    },

  };
}



function validateSessionPayload(
  value: unknown
):
  SessionPayload {

  if (
    typeof value !==
      "object" ||
    value === null
  ) {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  const payload =
    value as Partial<
      SessionPayload
    >;


  if (
    typeof payload.sub !==
      "string" ||
    payload.sub.length ===
      0
  ) {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  if (
    typeof payload.role !==
      "string" ||
    !AUTH_ROLES.includes(
      payload.role as AuthRole
    )
  ) {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  if (
    typeof payload.exp !==
      "number" ||
    !Number.isFinite(
      payload.exp
    )
  ) {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  return {
    sub:
      payload.sub,

    role:
      payload.role as AuthRole,

    exp:
      payload.exp,
  };
}



export function verifySessionToken(
  token: string
):
  SessionPayload {

  const parts =
    token.split(
      "."
    );


  if (
    parts.length !==
    2
  ) {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  const [
    encodedPayload,
    suppliedSignature,
  ] =
    parts;


  if (
    !encodedPayload ||
    !suppliedSignature
  ) {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  const expectedSignature =
    signPayload(
      encodedPayload
    );


  if (
    !safeEqual(
      suppliedSignature,
      expectedSignature
    )
  ) {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  let decoded:
    unknown;


  try {

    decoded =
      decodePayload(
        encodedPayload
      );

  } catch {

    throw new AppError(
      401,
      "INVALID_SESSION",
      "Invalid authentication session"
    );

  }


  const payload =
    validateSessionPayload(
      decoded
    );


  const currentTimestamp =
    Math.floor(
      Date.now() /
      1000
    );


  if (
    payload.exp <=
    currentTimestamp
  ) {

    throw new AppError(
      401,
      "SESSION_EXPIRED",
      "Authentication session expired"
    );

  }


  return payload;
}