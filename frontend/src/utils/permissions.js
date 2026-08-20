export const ROLES = {
  VIEWER:
    "VIEWER",

  RESPONDER:
    "RESPONDER",

  COMMANDER:
    "COMMANDER",
};


export function isViewer(
  user
) {

  return (
    user?.role ===
    ROLES.VIEWER
  );
}


export function isResponder(
  user
) {

  return (
    user?.role ===
    ROLES.RESPONDER
  );
}


export function isCommander(
  user
) {

  return (
    user?.role ===
    ROLES.COMMANDER
  );
}


export function canViewOperationalData(
  user
) {

  return Boolean(
    user
  );
}



export function canReportEvidence(
  user
) {

  return (
    isResponder(
      user
    ) ||
    isCommander(
      user
    )
  );
}


export function canVerifyEvidence(
  user
) {

  return isCommander(
    user
  );
}


export function canReviewFusion(
  user
) {

  return isCommander(
    user
  );
}


/*
|--------------------------------------------------------------------------
| Disaster administration
|--------------------------------------------------------------------------
*/

export function canManageDisasters(
  user
) {

  return isCommander(
    user
  );
}