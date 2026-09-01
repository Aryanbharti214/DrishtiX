import type { NextFunction, Request, Response } from "express";
import { autocompleteSchema, directionsSchema, nearbyFacilitiesSchema } from "./routing.types.js";
import { autocompleteLocation, calculateEmergencyRoutes, getNearbyFireStations } from "./routing.service.js";

export async function fireStationsController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = nearbyFacilitiesSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Invalid map location." } }); return; }
    const stations = await getNearbyFireStations(parsed.data.latitude, parsed.data.longitude, parsed.data.radiusMeters);
    res.json({ success: true, data: { stations } });
  } catch (error) { next(error); }
}

export async function autocompleteController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = autocompleteSchema.safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Enter at least two characters." } }); return; }
    const locations = await autocompleteLocation(parsed.data.text, parsed.data.latitude, parsed.data.longitude);
    res.json({ success: true, data: { locations } });
  } catch (error) { next(error); }
}

export async function directionsController(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = directionsSchema.safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Valid origin and destination locations are required." } }); return; }
    const result = await calculateEmergencyRoutes(parsed.data);
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
}
