import fs from "node:fs/promises";
import path from "node:path";

import { deleteAIResultImage } from "../../integrations/ai/ai.client.js";

export interface ImageryOwnedFiles {
  id: string;
  storedFilename: string;
}

async function unlinkUpload(filename: string) {
  if (path.basename(filename) !== filename) {
    throw new Error("Unsafe imagery filename");
  }

  const uploadsDirectory = path.resolve("uploads");
  const filePath = path.resolve(uploadsDirectory, filename);

  if (path.dirname(filePath) !== uploadsDirectory) {
    throw new Error("Unsafe imagery file path");
  }

  await fs.unlink(filePath).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "ENOENT") throw error;
  });
}

export async function removeImageryOwnedFiles(
  assets: ImageryOwnedFiles[]
) {
  const warnings: string[] = [];

  for (const asset of assets) {
    const operations = [
      unlinkUpload(asset.storedFilename),
      unlinkUpload(`${asset.id}-analysis.jpg`),
      deleteAIResultImage(asset.id),
    ];

    const results = await Promise.allSettled(operations);
    results.forEach((result) => {
      if (result.status === "rejected") {
        warnings.push(
          `${asset.id}: ${result.reason instanceof Error ? result.reason.message : "file cleanup failed"}`
        );
      }
    });
  }

  return warnings;
}
