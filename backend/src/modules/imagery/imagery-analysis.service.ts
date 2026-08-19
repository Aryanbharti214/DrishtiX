import fs from "node:fs/promises";
import path from "node:path";
import {
  refreshFindingCorrelationBestEffort,
} from "../findings/finding-correlation.service.js";
import {
  analyzeImageWithAI,
} from "../../integrations/ai/ai.client.js";

import {
  AppError,
} from "../../utils/app-error.js";

import {
  createAIRun,
  markAIRunProcessing,
  completeAIRun,
  failAIRun,
} from "../ai-runs/ai-run.repository.js";

import {
  createFinding,
} from "../findings/finding.repository.js";

import {
  aiAnalysisResponseSchema,
} from "../findings/finding.types.js";

import {
  getImageryByIdService,
} from "./imagery.service.js";

import {
  updateImageryStatus,
} from "./imagery.repository.js";


export async function analyzeImageryService(
  imageryId: string
) {
 

  const imagery =
    await getImageryByIdService(
      imageryId
    );


 

  if (
    imagery.processingStatus ===
    "QUEUED" ||
    imagery.processingStatus ===
    "PROCESSING"
  ) {
    throw new AppError(
      409,
      "IMAGERY_ANALYSIS_IN_PROGRESS",
      "Imagery analysis is already in progress"
    );
  }


  if (
    imagery.processingStatus ===
    "ANALYZED"
  ) {
    throw new AppError(
      409,
      "IMAGERY_ALREADY_ANALYZED",
      "Imagery has already been analyzed"
    );
  }



  const imagePath =
    path.resolve(
      "uploads",
      imagery.storedFilename
    );


  try {
    await fs.access(
      imagePath
    );
  } catch {
    throw new AppError(
      404,
      "IMAGERY_FILE_NOT_FOUND",
      "Stored imagery file could not be found"
    );
  }


 
  const aiRun =
    await createAIRun(
      imagery.id
    );


  try {
   

    await markAIRunProcessing(
      aiRun.id
    );


    await updateImageryStatus(
      imagery.id,
      "PROCESSING"
    );


  

    let aiResponse:
      unknown;


    try {
      aiResponse =
        await analyzeImageWithAI({
          imagePath,

          imageId:
            imagery.id,

          filename:
            imagery.originalFilename,

          mimeType:
            imagery.mimeType,
        });

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI service request failed";


      throw new AppError(
        502,
        "AI_SERVICE_ERROR",
        `AI service request failed: ${message}`
      );
    }


   

    const parsed =
      aiAnalysisResponseSchema
        .safeParse(
          aiResponse
        );


    if (!parsed.success) {
      console.error(
        "Invalid AI response:",
        parsed.error.flatten()
      );


      throw new AppError(
        502,
        "INVALID_AI_RESPONSE",
        "AI service returned an invalid response"
      );
    }


    const result =
      parsed.data;


  
    if (
      result.imageId !==
      imagery.id
    ) {
      throw new AppError(
        502,
        "AI_IMAGE_ID_MISMATCH",
        "AI service returned a mismatched image ID"
      );
    }


  

    for (
      const finding
      of result.findings
    ) {

      const createdFinding =
        await createFinding({
          disasterId:
            imagery.disasterId,

          imageryId:
            imagery.id,

          aiRunId:
            aiRun.id,

          finding,
        });


      await refreshFindingCorrelationBestEffort(
        createdFinding.id
      );

    }


    

    await completeAIRun(
      aiRun.id,
      {
        modelName:
          result.model.name,

        modelVersion:
          result.model.version,

        processingTimeMs:
          Math.round(
            result.processingTimeMs
          ),

        rawOutput:
          result,
      }
    );


   

    const updatedImagery =
      await updateImageryStatus(
        imagery.id,
        "ANALYZED"
      );


   
    return {
      imagery:
        updatedImagery,

      aiRunId:
        aiRun.id,

      detectionCount:
        result.detections.length,

      findingsCreated:
        result.findings.length,

      analysis:
        result,
    };

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown AI processing error";


    await failAIRun(
      aiRun.id,
      message
    );


    await updateImageryStatus(
      imagery.id,
      "FAILED"
    );


    throw error;
  }
}