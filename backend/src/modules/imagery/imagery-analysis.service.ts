import {
  createAIRun,
  markAIRunProcessing,
  completeAIRun,
  failAIRun,
} from "../ai-runs/ai-run.repository.js";

import {
  updateImageryStatus,
} from "./imagery.repository.js";

import {
  createFinding,
} from "../findings/finding.repository.js";

import {
  aiAnalysisResponseSchema,
} from "../findings/finding.types.js";

import { AppError } from "../../utils/app-error.js";

interface AnalyzeImageryInput {
  imageryId: string;
  disasterId: string;

  aiResponse: unknown;
}

export async function processAIResult(
  input: AnalyzeImageryInput
) {
  const aiRun =
    await createAIRun(
      input.imageryId
    );

  try {
    await markAIRunProcessing(
      aiRun.id
    );

    await updateImageryStatus(
      input.imageryId,
      "PROCESSING"
    );

    const parsed =
      aiAnalysisResponseSchema.safeParse(
        input.aiResponse
      );

    if (!parsed.success) {
      throw new AppError(
        502,
        "INVALID_AI_RESPONSE",
        "AI service returned an invalid response"
      );
    }

    const result = parsed.data;

    for (
      const finding of
      result.findings
    ) {
      await createFinding({
        disasterId:
          input.disasterId,

        imageryId:
          input.imageryId,

        aiRunId:
          aiRun.id,

        finding,
      });
    }

    await completeAIRun(
      aiRun.id,
      {
        modelName:
          result.model.name,

        modelVersion:
          result.model.version,

        processingTimeMs:
          result.processingTimeMs,

        rawOutput:
          result,
      }
    );

    await updateImageryStatus(
      input.imageryId,
      "ANALYZED"
    );

    return {
      aiRunId:
        aiRun.id,

      findingsCreated:
        result.findings.length,
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
      input.imageryId,
      "FAILED"
    );

    throw error;
  }
}
