CREATE EXTENSION IF NOT EXISTS postgis;


/*
|--------------------------------------------------------------------------
| Validate geographic coordinates
|--------------------------------------------------------------------------
*/

ALTER TABLE findings
DROP CONSTRAINT IF EXISTS findings_latitude_check;

ALTER TABLE findings
ADD CONSTRAINT findings_latitude_check
CHECK (
    latitude IS NULL
    OR latitude BETWEEN -90 AND 90
);


ALTER TABLE findings
DROP CONSTRAINT IF EXISTS findings_longitude_check;

ALTER TABLE findings
ADD CONSTRAINT findings_longitude_check
CHECK (
    longitude IS NULL
    OR longitude BETWEEN -180 AND 180
);


/*
|--------------------------------------------------------------------------
| PostGIS point
|--------------------------------------------------------------------------
|
| Longitude = X
| Latitude  = Y
|
| The application continues writing latitude/longitude.
| PostgreSQL derives the geography value automatically.
|--------------------------------------------------------------------------
*/

ALTER TABLE findings
ADD COLUMN IF NOT EXISTS location
geography(Point, 4326)
GENERATED ALWAYS AS (
    CASE
        WHEN latitude IS NOT NULL
         AND longitude IS NOT NULL
        THEN
            ST_SetSRID(
                ST_MakePoint(
                    longitude,
                    latitude
                ),
                4326
            )::geography
        ELSE NULL
    END
) STORED;


/*
|--------------------------------------------------------------------------
| Spatial index
|--------------------------------------------------------------------------
*/

CREATE INDEX IF NOT EXISTS
idx_findings_location_gist
ON findings
USING GIST(location);