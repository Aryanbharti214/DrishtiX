import { AppError } from "../../utils/app-error.js";

import {
  createDisaster,
  bulkDeleteDisasters,
  findAllDisasters,
  findDisasterById,
  updateDisaster,
} from "./disaster.repository.js";
import { removeImageryOwnedFiles } from "../imagery/imagery-files.service.js";

import type {
  CreateDisasterInput,
  UpdateDisasterInput,
} from "./disaster.types.js";

export async function createDisasterService(
  input: CreateDisasterInput
) {
  return createDisaster(input);
}

export async function getAllDisastersService() {
  return findAllDisasters();
}

export async function getDisasterByIdService(
  id: string
) {
  const disaster =
    await findDisasterById(id);

  if (!disaster) {
    throw new AppError(
      404,
      "DISASTER_NOT_FOUND",
      "Disaster not found"
    );
  }

  return disaster;
}

export async function updateDisasterService(
  id: string,
  input: UpdateDisasterInput
) {
  const disaster =
    await updateDisaster(id, input);

  if (!disaster) {
    throw new AppError(
      404,
      "DISASTER_NOT_FOUND",
      "Disaster not found"
    );
  }

  return disaster;
}

export async function bulkDeleteDisastersService(
  ids: string[]
) {
  const result = await bulkDeleteDisasters(ids);

  if (result.kind === "missing") {
    throw new AppError(
      404,
      "DISASTER_NOT_FOUND",
      "One or more selected disaster events no longer exist"
    );
  }

  if (result.kind === "active") {
    throw new AppError(
      409,
      "IMAGERY_PROCESSING",
      "A selected disaster contains imagery that is currently being analyzed"
    );
  }

  const cleanupWarnings = await removeImageryOwnedFiles(result.assets);

  return {
    deletedCount: result.disasters.length,
    deletedIds: result.disasters.map((item) => item.id),
    cleanupWarnings,
  };
}
