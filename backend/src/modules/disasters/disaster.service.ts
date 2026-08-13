import { AppError } from "../../utils/app-error.js";

import {
  createDisaster,
  findAllDisasters,
  findDisasterById,
  updateDisaster,
} from "./disaster.repository.js";

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