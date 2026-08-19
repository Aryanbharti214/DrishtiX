import fs from "node:fs/promises";
import path from "node:path";

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

  /*
   * 1. Load imagery record
   */
  const imagery =
    await getImageryByIdService(
      imageryId
    );


  /*
   * 2. Prevent duplicate/concurrent
   * analysis.
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
   * FAILED imagery is allowed
   * to retry.
   */


  /*
   * 3. Build actual stored-file path.
   *
   * Multer stores files in:
   * backend/uploads/
   */
  const imagePath =
    path.resolve(
      "uploads",
      imagery.storedFilename
    );


  /*
   * 4. Ensure file still exists.
   */
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
   * 5. Create AI run.
   */
  const aiRun =
    await createAIRun(
      imagery.id
    );


  try {

    /*
     * 6. Queue operation.
     */
    await updateImageryStatus(
      imagery.id,
      "QUEUED"
    );


    /*
     * 7. Mark run + imagery
     * as processing.
     */
    await markAIRunProcessing(
      aiRun.id
    );


    await updateImageryStatus(
      imagery.id,
      "PROCESSING"
    );


    /*
     * 8. Send stored image
     * to FastAPI.
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
     * 9. Validate response
     * from FastAPI.
     */
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


    /*
     * 10. Ensure FastAPI analyzed
     * the same imagery.
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
     * 11. Persist real
     * disaster-domain findings.
     *
     * Generic YOLO currently
     * returns [] here.
     */
    for (
      const finding
      of result.findings
    ) {

      await createFinding({
        disasterId:
          imagery.disasterId,

        imageryId:
          imagery.id,

        aiRunId:
          aiRun.id,

        finding,
      });
    }


    /*
     * 12. Complete AI run.
     *
     * DB column is currently INTEGER,
     * therefore round milliseconds.
     */
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


    /*
     * 13. Mark image analyzed.
     */
    const updatedImagery =
      await updateImageryStatus(
        imagery.id,
        "ANALYZED"
      );


    /*
     * 14. Return useful result
     * to frontend.
     */
    return {
      imagery:
        updatedImagery,

      aiRunId:
        aiRun.id,

      findingsCreated:
        result.findings.length,

      detectionCount:
        result.detections.length,

      analysis:
        result,
    };

  } catch (error) {

    /*
     * Mark run and imagery
     * failed if anything after
     * AI-run creation fails.
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