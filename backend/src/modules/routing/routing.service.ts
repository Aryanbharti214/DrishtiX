import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import type { DirectionsInput } from "./routing.types.js";

const ORS_BASE_URL = "https://api.openrouteservice.org";
const OVERPASS_ENDPOINTS = [
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

function requireORSKey() {
  if (!env.ORS_API_KEY.trim()) {
    throw new AppError(503, "ROUTING_NOT_CONFIGURED", "Routing service is not configured.");
  }
  return env.ORS_API_KEY;
}

function addressFromTags(tags: Record<string, string>) {
  return tags["addr:full"] || [tags["addr:housenumber"], tags["addr:street"], tags["addr:city"]].filter(Boolean).join(", ") || null;
}

export async function getNearbyFireStations(latitude: number, longitude: number, radiusMeters: number) {
  let lastError: unknown;
  let receivedProviderResponse = false;
  const searchRadii = [...new Set([radiusMeters, 30_000, 50_000])]
    .filter((radius) => radius >= radiusMeters && radius <= 50_000)
    .sort((first, second) => first - second);

  for (const radius of searchRadii) {
    const query = `[out:json][timeout:20];nwr["amenity"="fire_station"](around:${radius},${latitude},${longitude});out center tags;`;
    for (const endpoint of OVERPASS_ENDPOINTS) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "User-Agent": "DrishtiX/1.0 disaster-response-map",
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`Overpass HTTP ${response.status}`);
        const data = await response.json() as { elements?: Array<Record<string, unknown>> };
        receivedProviderResponse = true;
        const stations = (data.elements ?? []).map((element) => {
          const center = element.center as { lat?: number; lon?: number } | undefined;
          const lat = element.lat as number | undefined ?? center?.lat;
          const lon = element.lon as number | undefined ?? center?.lon;
          const tags = (element.tags ?? {}) as Record<string, string>;
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return {
            id: `${String(element.type)}-${String(element.id)}`,
            name: tags.name || tags["name:en"] || "Fire Station",
            latitude: lat!,
            longitude: lon!,
            address: addressFromTags(tags),
            operator: tags.operator || null,
          };
        }).filter((station): station is NonNullable<typeof station> => station !== null);
        if (stations.length > 0) return stations;
        break;
      } catch (error) {
        lastError = error;
      }
    }
  }
  if (receivedProviderResponse) return [];
  console.error("Fire-station lookup failed", lastError);
  throw new AppError(502, "FIRE_STATIONS_UNAVAILABLE", "No nearby fire stations were found.");
}

export async function autocompleteLocation(text: string, latitude?: number, longitude?: number) {
  const key = requireORSKey();
  const url = new URL(`${ORS_BASE_URL}/geocode/autocomplete`);
  url.searchParams.set("api_key", key);
  url.searchParams.set("text", text);
  url.searchParams.set("size", "6");
  if (latitude !== undefined && longitude !== undefined) {
    url.searchParams.set("focus.point.lat", String(latitude));
    url.searchParams.set("focus.point.lon", String(longitude));
  }
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`ORS geocoding HTTP ${response.status}`);
    const data = await response.json() as { features?: Array<{ geometry?: { coordinates?: number[] }; properties?: Record<string, unknown> }> };
    return (data.features ?? []).map((feature, index) => {
      const coordinates = feature.geometry?.coordinates;
      if (!coordinates || coordinates.length < 2) return null;
      const properties = feature.properties ?? {};
      return {
        id: String(properties.id ?? properties.gid ?? `location-${index}`),
        name: String(properties.name ?? properties.label ?? "Selected location"),
        label: String(properties.label ?? properties.name ?? "Selected location"),
        latitude: Number(coordinates[1]),
        longitude: Number(coordinates[0]),
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null && Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  } catch (error) {
    console.error("ORS autocomplete failed", error);
    throw new AppError(502, "GEOCODING_UNAVAILABLE", "Location search is unavailable right now. Please try again.");
  }
}

async function requestDirections(input: DirectionsInput, alternatives: boolean) {
  const response = await fetch(`${ORS_BASE_URL}/v2/directions/driving-car/geojson`, {
    method: "POST",
    headers: { Authorization: requireORSKey(), "Content-Type": "application/json" },
    body: JSON.stringify({
      coordinates: [[input.origin.longitude, input.origin.latitude], [input.destination.longitude, input.destination.latitude]],
      ...(alternatives ? { alternative_routes: { target_count: 3, weight_factor: 1.6, share_factor: 0.6 } } : {}),
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 404) {
      throw new AppError(422, "NO_DRIVABLE_ROUTE", "No drivable route was found between these locations.");
    }
    throw new Error(`ORS directions HTTP ${response.status}: ${detail.slice(0, 500)}`);
  }
  return response.json() as Promise<{ features?: Array<{ geometry?: { type?: string; coordinates?: number[][] }; properties?: { summary?: { distance?: number; duration?: number } } }> }>;
}

export async function calculateEmergencyRoutes(input: DirectionsInput) {
  requireORSKey();
  try {
    let data;
    try {
      data = await requestDirections(input, true);
    } catch (alternativeError) {
      console.warn("ORS alternatives unavailable; retrying one route", alternativeError);
      data = await requestDirections(input, false);
    }
    const routes = (data.features ?? []).map((feature, index) => {
      const summary = feature.properties?.summary;
      const coordinates = feature.geometry?.coordinates;
      if (feature.geometry?.type !== "LineString" || !coordinates?.length || !Number.isFinite(summary?.distance) || !Number.isFinite(summary?.duration)) return null;
      return { id: `route-${index + 1}`, distanceMeters: summary!.distance!, durationSeconds: summary!.duration!, geometry: { type: "LineString" as const, coordinates } };
    }).filter((route): route is NonNullable<typeof route> => route !== null)
      .sort((a, b) => a.durationSeconds - b.durationSeconds)
      .slice(0, 3)
      .map((route, index) => ({ ...route, recommended: index === 0 }));
    if (!routes.length) throw new AppError(422, "NO_DRIVABLE_ROUTE", "No drivable route was found between these locations.");
    return { origin: input.origin, destination: input.destination, routes, warnings: ["Hazard avoidance data is limited for this area."] };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("ORS route calculation failed", error);
    throw new AppError(502, "ROUTING_UNAVAILABLE", "Route could not be calculated right now. Please try again.");
  }
}
