import fs from "node:fs";

import axios from "axios";
import FormData from "form-data";

import {
  env,
} from "../../config/env.js";
import type { ImagerySourceType } from "../../modules/imagery/imagery.types.js";


const aiClient =
  axios.create({
    baseURL:
      env.AI_SERVICE_URL,

    timeout: 5000,
  });


export async function checkAIServiceHealth() {
  const response =
    await aiClient.get(
      "/health"
    );

  return response.data;
}


interface AnalyzeImageInput {
  imagePath: string;

  imageId: string;

  filename: string;

  mimeType: string;

  sourceType: ImagerySourceType;

  analysisMode?: "SINGLE_IMAGE" | "BEFORE_AFTER";

  beforeImagePath?: string;

  beforeFilename?: string;

  beforeMimeType?: string;
}


export async function analyzeImageWithAI(
  input: AnalyzeImageInput
): Promise<unknown> {

  const form =
    new FormData();


  form.append(
    "image",
    fs.createReadStream(
      input.imagePath
    ),
    {
      filename:
        input.filename,

      contentType:
        input.mimeType,
    }
  );


  form.append(
    "imageId",
    input.imageId
  );


  form.append(
    "sourceType",
    input.sourceType
  );

  form.append(
    "analysisMode",
    input.analysisMode ?? "SINGLE_IMAGE"
  );

  if (input.beforeImagePath) {
    form.append(
      "beforeImage",
      fs.createReadStream(input.beforeImagePath),
      {
        filename: input.beforeFilename ?? "before.jpg",
        contentType: input.beforeMimeType ?? "image/jpeg",
      }
    );
  }


  try {
    const response =
      await aiClient.post(
      "/api/v1/analyze",
      form,
      {
        headers: {
          ...form.getHeaders(),
        },

    
        timeout: 30_000,

        maxBodyLength:
          Infinity,

        maxContentLength:
          Infinity,
      }
      );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const detail = error.response?.data?.detail;
      if (typeof detail === "string" && detail.trim()) {
        throw new Error(detail);
      }
      if (error.response && error.response.status >= 500) {
        throw new Error(
          "Satellite analysis could not be completed. Please try again."
        );
      }
    }
    throw error;
  }
}


export async function fetchAIResultImage(
  resultPath: string
): Promise<Buffer> {

  if (
    !resultPath.startsWith(
      "/api/v1/analyze/"
    )
  ) {
    throw new Error(
      "Invalid AI result image path"
    );
  }


  const response =
    await aiClient.get(
      resultPath,
      {
        responseType:
          "arraybuffer",

        timeout:
          30_000,
      }
    );


  return Buffer.from(
    response.data
  );
}

export async function deleteAIResultImage(
  imageId: string
) {
  try {
    await aiClient.delete(
      `/api/v1/analyze/${imageId}/result`,
      { timeout: 10_000 }
    );
    return true;
  } catch (error) {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 404
    ) {
      return false;
    }
    throw error;
  }
}
