const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000/api/v1";

const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN ||
  "http://localhost:4000";


async function apiRequest(
  path,
  options = {}
) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...options,

      headers: {
        ...options.headers,
      },
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(
      data?.error?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data;
}




export async function getHealth() {
  return apiRequest("/health");
}



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
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
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


export async function analyzeImagery(
  imageryId
) {
  return apiRequest(
    `/imagery/${imageryId}/analyze`,
    {
      method: "POST",
    }
  );
}


export async function uploadImagery(
  formData
) {
  return apiRequest(
    "/imagery",
    {
      method: "POST",
      body: formData,
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
  if (!path) {
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
    path.startsWith("/")
      ? path
      : `/${path}`;

  return `${BACKEND_ORIGIN}${normalizedPath}`;
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
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
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
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify(
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