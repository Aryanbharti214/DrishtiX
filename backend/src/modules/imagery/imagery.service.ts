import fs from "node:fs/promises";

import { AppError } from "../../utils/app-error.js";

import {
  createImagery,
  bulkDeleteImagery,
  findImageryById,
  findImageryByDisaster,
} from "./imagery.repository.js";
import { removeImageryOwnedFiles } from "./imagery-files.service.js";

import {
  findDisasterById,
} from "../disasters/disaster.repository.js";

import type {
  CreateImageryMetadataInput,
} from "./imagery.types.js";

interface UploadedFileData {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

export async function createImageryService(
  metadata: CreateImageryMetadataInput,
  file: UploadedFileData
) {
  const disaster =
    await findDisasterById(
      metadata.disasterId
    );

  if (!disaster) {
    await fs.unlink(file.path)
      .catch(() => undefined);

    throw new AppError(
      404,
      "DISASTER_NOT_FOUND",
      "Disaster not found"
    );
  }

  return createImagery({
    disasterId:
      metadata.disasterId,

    sourceType:
      metadata.sourceType,

    originalFilename:
      file.originalname,

    storedFilename:
      file.filename,

    imageUrl:
      `/uploads/${file.filename}`,

    mimeType:
      file.mimetype,

    sizeBytes:
      file.size,

    latitude:
      metadata.latitude,

    longitude:
      metadata.longitude,

    capturedAt:
      metadata.capturedAt,
  });
}

export async function getImageryByIdService(
  id: string
) {
  const imagery =
    await findImageryById(id);

  if (!imagery) {
    throw new AppError(
      404,
      "IMAGERY_NOT_FOUND",
      "Imagery not found"
    );
  }

  return imagery;
}

export async function getDisasterImageryService(
  disasterId: string
) {
  return findImageryByDisaster(
    disasterId
  );
}

export async function bulkDeleteImageryService(
  ids: string[]
) {
  const result = await bulkDeleteImagery(ids);

  if (result.kind === "missing") {
    throw new AppError(
      404,
      "IMAGERY_NOT_FOUND",
      "One or more selected imagery records no longer exist"
    );
  }

  if (result.kind === "active") {
    throw new AppError(
      409,
      "IMAGERY_PROCESSING",
      "Queued or processing imagery cannot be deleted"
    );
  }

  const cleanupWarnings = await removeImageryOwnedFiles(result.assets);

  return {
    deletedCount: result.assets.length,
    deletedIds: result.assets.map((item) => item.id),
    cleanupWarnings,
  };
}
