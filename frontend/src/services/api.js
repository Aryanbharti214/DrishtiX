const AUTH_TOKEN_KEY =
  "drishtix_auth_token";


const AUTH_USER_KEY =
  "drishtix_auth_user";


const CURRENT_ORIGIN =
  typeof window !== "undefined"
    ? window.location.origin
    : "";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${CURRENT_ORIGIN}/api/v1`;


const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN ||
  CURRENT_ORIGIN;



export function getAuthToken() {

  return sessionStorage.getItem(
    AUTH_TOKEN_KEY
  );
}


export function getAuthUser() {

  const raw =
    sessionStorage.getItem(
      AUTH_USER_KEY
    );


  if (
    !raw
  ) {

    return null;

  }


  try {

    return JSON.parse(
      raw
    );

  } catch {

    sessionStorage.removeItem(
      AUTH_USER_KEY
    );


    return null;

  }
}


function setAuthToken(
  token
) {

  sessionStorage.setItem(
    AUTH_TOKEN_KEY,
    token
  );
}


export function setAuthUser(
  user
) {

  if (
    !user
  ) {

    sessionStorage.removeItem(
      AUTH_USER_KEY
    );


    return;

  }


  sessionStorage.setItem(
    AUTH_USER_KEY,
    JSON.stringify(
      user
    )
  );
}


export function clearAuthToken() {

  sessionStorage.removeItem(
    AUTH_TOKEN_KEY
  );


  sessionStorage.removeItem(
    AUTH_USER_KEY
  );
}



async function apiRequest(
  path,
  options = {}
) {

  const token =
    getAuthToken();


  const response =
    await fetch(
      `${API_BASE_URL}${path}`,
      {
        ...options,

        headers: {

          ...(
            token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}
          ),

          ...options.headers,

        },
      }
    );


  let data =
    null;


  try {

    data =
      await response.json();

  } catch {

    data =
      null;

  }



  if (
    response.status ===
      401 &&
    path !==
      "/auth/login"
  ) {

    clearAuthToken();


    window.dispatchEvent(
      new Event(
        "drishtix:unauthorized"
      )
    );

  }


  if (
    !response.ok
  ) {

    throw new Error(
      data?.error?.message ||
      data?.message ||
      `Request failed with status ${response.status}`
    );

  }


  return data;
}



export async function login(
  credentials
) {

  const response =
    await apiRequest(
      "/auth/login",
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          JSON.stringify(
            credentials
          ),
      }
    );


  const token =
    response?.data?.token;


  const user =
    response?.data?.user;


  if (
    !token
  ) {

    throw new Error(
      "Authentication token was not returned by the backend"
    );

  }


  if (
    !user
  ) {

    throw new Error(
      "Authenticated user was not returned by the backend"
    );

  }


  setAuthToken(
    token
  );


  setAuthUser(
    user
  );


  return response;
}


export async function getAuthSession() {

  const response =
    await apiRequest(
      "/auth/session"
    );


  const user =
    response?.data?.user;


  if (
    user
  ) {

    setAuthUser(
      user
    );

  }


  return response;
}




export async function getHealth() {

  return apiRequest(
    "/health"
  );
}


/*
|--------------------------------------------------------------------------
| Disasters
|--------------------------------------------------------------------------
*/

export async function getDisasters() {

  return apiRequest(
    "/disasters"
  );
}


export async function createDisaster(
  disaster
) {

  return apiRequest(
    "/disasters",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          disaster
        ),
    }
  );
}


export async function getDisaster(
  id
) {

  return apiRequest(
    `/disasters/${id}`
  );
}


/*
|--------------------------------------------------------------------------
| Imagery
|--------------------------------------------------------------------------
*/

export async function analyzeImagery(
  imageryId
) {

  return apiRequest(
    `/imagery/${imageryId}/analyze`,
    {
      method:
        "POST",
    }
  );
}

export async function getImageryAnalysis(
  imageryId
) {

  return apiRequest(
    `/imagery/${imageryId}/analysis`
  );
}
export async function uploadImagery(
  formData
) {

  return apiRequest(
    "/imagery",
    {
      method:
        "POST",

      body:
        formData,
    }
  );
}


export async function getDisasterImagery(
  disasterId
) {

  return apiRequest(
    `/imagery/disaster/${disasterId}`
  );
}


export async function getImageryById(
  imageryId
) {

  return apiRequest(
    `/imagery/${imageryId}`
  );
}


export function getAssetUrl(
  path
) {

  if (
    !path
  ) {

    return "";

  }


  if (
    path.startsWith(
      "http://"
    ) ||
    path.startsWith(
      "https://"
    )
  ) {

    return path;

  }


  const normalizedPath =
    path.startsWith(
      "/"
    )
      ? path
      : `/${path}`;


  return (
    `${BACKEND_ORIGIN}${normalizedPath}`
  );
}

export async function getDisasterFindings(
  disasterId
) {

  return apiRequest(
    `/findings/disaster/${disasterId}`
  );
}


export async function getFindingById(
  findingId
) {

  return apiRequest(
    `/findings/${findingId}`
  );
}


export async function createManualFinding(
  payload
) {

  return apiRequest(
    "/findings/manual",
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}



export async function verifyFinding(
  findingId,
  payload
) {

  return apiRequest(
    `/findings/${findingId}/verify`,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}


export async function getFindingVerificationHistory(
  findingId
) {

  return apiRequest(
    `/findings/${findingId}/verifications`
  );
}

export async function getFindingRelations(
  findingId
) {

  return apiRequest(
    `/findings/${findingId}/relations`
  );
}


export async function getEvidenceClusters(
  disasterId
) {

  return apiRequest(
    `/findings/disaster/${disasterId}/clusters`
  );
}



export async function generateFusionRecommendation(
  disasterId,
  anchorFindingId
) {

  return apiRequest(
    `/findings/disaster/${disasterId}/clusters/${anchorFindingId}/fusion-recommendation`,
    {
      method:
        "POST",
    }
  );
}


export async function getFusionRecommendations(
  disasterId
) {

  return apiRequest(
    `/findings/disaster/${disasterId}/fusion-recommendations`
  );
}


export async function reviewFusionRecommendation(
  recommendationId,
  payload
) {

  return apiRequest(
    `/findings/fusion-recommendations/${recommendationId}/review`,
    {
      method:
        "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body:
        JSON.stringify(
          payload
        ),
    }
  );
}




export async function getDisasterPriorities(
  disasterId
) {

  return apiRequest(
    `/findings/disaster/${disasterId}/priorities`
  );
}

