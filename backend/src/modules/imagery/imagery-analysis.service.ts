import fs from "node:fs/promises";
import path from "node:path";

import {
  analyzeImageWithAI,
  fetchAIResultImage,
} from "../../integrations/ai/ai.client.js";

import {
  AppError,
} from "../../utils/app-error.js";

import {
  createAIRun,
  markAIRunProcessing,
  completeAIRun,
  failAIRun,
  findLatestSuccessfulAIRunByImagery,
} from "../ai-runs/ai-run.repository.js";

import {
  createFinding,
} from "../findings/finding.repository.js";

import {
  refreshFindingCorrelationBestEffort,
} from "../findings/finding-correlation.service.js";

import {
  aiAnalysisResponseSchema,
} from "../findings/finding.types.js";

import {
  getImageryByIdService,
} from "./imagery.service.js";

import {
  updateImageryStatus,
} from "./imagery.repository.js";


/*
|--------------------------------------------------------------------------
| Analyze imagery
|--------------------------------------------------------------------------
*/

export async function analyzeImageryService(
  imageryId: string
) {

  /*
  |--------------------------------------------------------------------------
  | Load imagery
  |--------------------------------------------------------------------------
  */

  const imagery =
    await getImageryByIdService(
      imageryId
    );


  /*
  |--------------------------------------------------------------------------
  | Prevent duplicate / concurrent analysis
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | Resolve original uploaded image
  |--------------------------------------------------------------------------
  */

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


  /*
  |--------------------------------------------------------------------------
  | Create AI run
  |--------------------------------------------------------------------------
  */

  const aiRun =
    await createAIRun(
      imagery.id
    );


  try {

    /*
    |--------------------------------------------------------------------------
    | Mark processing
    |--------------------------------------------------------------------------
    */

    await markAIRunProcessing(
      aiRun.id
    );


    await updateImageryStatus(
      imagery.id,
      "PROCESSING"
    );


    /*
    |--------------------------------------------------------------------------
    | Call FastAPI AI service
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | Validate AI response
    |--------------------------------------------------------------------------
    */

    const parsed =
      aiAnalysisResponseSchema
        .safeParse(
          aiResponse
        );


    if (
      !parsed.success
    ) {

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


    /*
    |--------------------------------------------------------------------------
    | Ensure correct imagery
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | Persist segmentation overlay
    |--------------------------------------------------------------------------
    |
    | FastAPI generates the segmentation visualization.
    |
    | We copy that visualization into backend/uploads so:
    |
    | frontend -> Node
    |
    | instead of:
    |
    | frontend -> FastAPI
    |
    |--------------------------------------------------------------------------
    */

    let persistedResultImage:
      string | undefined;


    if (
      result.resultImage
    ) {

      try {

        const overlayBuffer =
          await fetchAIResultImage(
            result.resultImage
          );


        const overlayFilename =
          `${imagery.id}-analysis.jpg`;


        const uploadsDirectory =
          path.resolve(
            "uploads"
          );


        await fs.mkdir(
          uploadsDirectory,
          {
            recursive: true,
          }
        );


        const overlayPath =
          path.join(
            uploadsDirectory,
            overlayFilename
          );


        await fs.writeFile(
          overlayPath,
          overlayBuffer
        );


        persistedResultImage =
          `/uploads/${overlayFilename}`;

      } catch (error) {

        /*
         * Overlay persistence is useful,
         * but inference itself already succeeded.
         *
         * Therefore visualization failure should
         * not mark the entire AI analysis as failed.
         */

        console.error(
          "Failed to persist AI result image:",
          error
        );
      }
    }


    /*
    |--------------------------------------------------------------------------
    | Normalize user-facing result
    |--------------------------------------------------------------------------
    |
    | Replace FastAPI's internal result path with
    | the backend-owned uploaded asset.
    |--------------------------------------------------------------------------
    */

    const normalizedResult = {
      ...result,

      resultImage:
        persistedResultImage,
    };


    /*
    |--------------------------------------------------------------------------
    | Persist actionable findings
    |--------------------------------------------------------------------------
    */

    for (
      const finding
      of normalizedResult.findings
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


      /*
       * Generate / refresh spatial correlation
       * without making finding persistence depend
       * on correlation success.
       */

      await refreshFindingCorrelationBestEffort(
        createdFinding.id
      );
    }


    /*
    |--------------------------------------------------------------------------
    | Complete AI run
    |--------------------------------------------------------------------------
    |
    | rawOutput stores:
    |
    | - model metadata
    | - priority
    | - findings
    | - segmentation summary
    | - backend result image
    |--------------------------------------------------------------------------
    */

    await completeAIRun(
      aiRun.id,
      {
        modelName:
          normalizedResult
            .model
            .name,

        modelVersion:
          normalizedResult
            .model
            .version,

        processingTimeMs:
          Math.round(
            normalizedResult
              .processingTimeMs
          ),

        rawOutput:
          normalizedResult,
      }
    );


    /*
    |--------------------------------------------------------------------------
    | Mark imagery analyzed
    |--------------------------------------------------------------------------
    */

    const updatedImagery =
      await updateImageryStatus(
        imagery.id,
        "ANALYZED"
      );


    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return {
      imagery:
        updatedImagery,

      aiRunId:
        aiRun.id,

      detectionCount:
        normalizedResult
          .detections
          .length,

      findingsCreated:
        normalizedResult
          .findings
          .length,

      analysis:
        normalizedResult,
    };

  } catch (error) {

    /*
    |--------------------------------------------------------------------------
    | Failure handling
    |--------------------------------------------------------------------------
    */

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


/*
|--------------------------------------------------------------------------
| Get saved imagery analysis
|--------------------------------------------------------------------------
|
| Allows the frontend to retrieve the AI assessment after:
|
| - browser refresh
| - logout/login
| - page navigation
|
| The analysis comes from ai_runs.raw_output.
|--------------------------------------------------------------------------
*/

export async function getImageryAnalysisService(
  imageryId: string
) {

  /*
   * Verify that the imagery actually exists.
   */

  await getImageryByIdService(
    imageryId
  );


  const aiRun =
    await findLatestSuccessfulAIRunByImagery(
      imageryId
    );


  if (
    !aiRun
  ) {

    throw new AppError(
      404,
      "IMAGERY_ANALYSIS_NOT_FOUND",
      "No successful AI analysis exists for this imagery"
    );
  }


  return {
    aiRunId:
      aiRun.id,

    modelName:
      aiRun.model_name,

    modelVersion:
      aiRun.model_version,

    processingTimeMs:
      aiRun.processing_time_ms,

    completedAt:
      aiRun.completed_at,

    analysis:
      aiRun.raw_output,
  };
}