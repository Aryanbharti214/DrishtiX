import { z } from "zod";

const latitude = z.coerce.number().min(-90).max(90);
const longitude = z.coerce.number().min(-180).max(180);

export const nearbyFacilitiesSchema = z.object({
  latitude,
  longitude,
  radiusMeters: z.coerce.number().int().min(1000).max(50000).default(12000),
});

export const autocompleteSchema = z.object({
  text: z.string().trim().min(2).max(200),
  latitude: latitude.optional(),
  longitude: longitude.optional(),
});

export const directionsSchema = z.object({
  origin: z.object({ latitude, longitude, name: z.string().trim().min(1).max(250) }),
  destination: z.object({ latitude, longitude, name: z.string().trim().min(1).max(250) }),
});

export type DirectionsInput = z.infer<typeof directionsSchema>;
