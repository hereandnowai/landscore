-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Add geometry column to parcels table
ALTER TABLE parcels 
ADD COLUMN IF NOT EXISTS geometry geometry(MultiPolygon, 4326);

-- Create spatial index for fast geospatial queries
CREATE INDEX IF NOT EXISTS idx_parcels_geometry 
ON parcels USING GIST (geometry);

-- Create index on centroid for point-based queries
CREATE INDEX IF NOT EXISTS idx_parcels_centroid 
ON parcels (centroid_lat, centroid_lng);

-- Function to auto-update centroid when geometry changes
CREATE OR REPLACE FUNCTION update_parcel_centroid()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.geometry IS NOT NULL THEN
        NEW.centroid_lng := ST_X(ST_Centroid(NEW.geometry));
        NEW.centroid_lat := ST_Y(ST_Centroid(NEW.geometry));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update centroid on insert/update
DROP TRIGGER IF EXISTS trigger_update_parcel_centroid ON parcels;
CREATE TRIGGER trigger_update_parcel_centroid
    BEFORE INSERT OR UPDATE OF geometry ON parcels
    FOR EACH ROW
    EXECUTE FUNCTION update_parcel_centroid();
