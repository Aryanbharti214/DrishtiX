import fs from "node:fs";

import axios from "axios";
import FormData from "form-data";

import {
  env,
} from "../../config/env.js";


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