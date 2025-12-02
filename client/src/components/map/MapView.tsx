"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import maplibregl, {
  Map,
  LngLatBoundsLike,
  MapGeoJSONFeature,
} from "maplibre-gl";
import type GeoJSON from "geojson";
import "maplibre-gl/dist/maplibre-gl.css";
import { useMapStore } from "@/store/mapStore";
import { useParcelsGeoJSON } from "@/hooks/useApi";
import { Spinner } from "@/components/ui/spinner";
import type { BBoxQuery } from "@/lib/api";

// Austin, Texas center coordinates
const INITIAL_CENTER: [number, number] = [-97.7431, 30.2672];
const INITIAL_ZOOM = 11;

// Use CartoDB Positron (high quality, free, no API key needed for non-commercial)
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    "raster-tiles": {
      type: "raster" as const,
      tiles: ["https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [
    {
      id: "simple-tiles",
      type: "raster" as const,
      source: "raster-tiles",
      minzoom: 0,
      maxzoom: 22,
    },
  ],
};

// Zoning color mapping
const ZONING_COLORS: Record<string, string> = {
  AGRICULTURAL: "#22c55e", // green
  RESIDENTIAL: "#3b82f6", // blue
  COMMERCIAL: "#f59e0b", // amber
  INDUSTRIAL: "#ef4444", // red
  MIXED_USE: "#8b5cf6", // purple
  PROTECTED: "#10b981", // emerald
};

interface MapViewProps {
  onParcelClick?: (parcelId: string) => void;
  className?: string;
}

export function MapView({ onParcelClick, className }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [hoveredParcelId, setHoveredParcelId] = useState<string | null>(null);

  const {
    viewport,
    selectedParcelId,
    setViewport,
    setSelectedParcelId,
    setHoveredParcelId: setStoreHoveredParcelId,
  } = useMapStore();

  // Calculate bounding box from viewport
  const getBounds = useCallback(() => {
    if (!mapRef.current) return null;
    const bounds = mapRef.current.getBounds();
    return {
      minLng: bounds.getWest(),
      minLat: bounds.getSouth(),
      maxLng: bounds.getEast(),
      maxLat: bounds.getNorth(),
    };
  }, []);

  // Fetch parcels when map moves
  const [bounds, setBounds] = useState<BBoxQuery | null>(null);

  const { data: geojsonData, isLoading } = useParcelsGeoJSON(bounds);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // Log any tile loading errors
    map.on("error", (e) => {
      console.error("Map error:", e.error);
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(
      new maplibregl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
      }),
      "top-right"
    );
    map.addControl(new maplibregl.ScaleControl(), "bottom-left");

    map.on("load", () => {
      setMapLoaded(true);

      // Add parcel source (initially empty)
      map.addSource("parcels", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
        generateId: true,
      });

      // Add parcel fill layer
      map.addLayer({
        id: "parcels-fill",
        type: "fill",
        source: "parcels",
        paint: {
          "fill-color": [
            "match",
            ["get", "zoning"],
            "AGRICULTURAL",
            ZONING_COLORS.AGRICULTURAL,
            "RESIDENTIAL",
            ZONING_COLORS.RESIDENTIAL,
            "COMMERCIAL",
            ZONING_COLORS.COMMERCIAL,
            "INDUSTRIAL",
            ZONING_COLORS.INDUSTRIAL,
            "MIXED_USE",
            ZONING_COLORS.MIXED_USE,
            "PROTECTED",
            ZONING_COLORS.PROTECTED,
            "#6b7280", // default gray
          ],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            0.8,
            ["boolean", ["feature-state", "hover"], false],
            0.6,
            0.4,
          ],
        },
      });

      // Add parcel outline layer
      map.addLayer({
        id: "parcels-outline",
        type: "line",
        source: "parcels",
        paint: {
          "line-color": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            "#ffffff",
            "#000000",
          ],
          "line-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,
            ["boolean", ["feature-state", "hover"], false],
            2,
            1,
          ],
        },
      });

      // Set initial bounds
      const b = map.getBounds();
      setBounds({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    });

    // Handle map movement
    map.on("moveend", () => {
      const b = map.getBounds();
      const center = map.getCenter();

      setViewport({
        longitude: center.lng,
        latitude: center.lat,
        zoom: map.getZoom(),
      });

      setBounds({
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      });
    });

    // Handle parcel hover
    map.on("mousemove", "parcels-fill", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["parcels-fill"],
      });
      if (features && features.length > 0) {
        map.getCanvas().style.cursor = "pointer";

        // Clear previous hover state
        if (hoveredParcelId !== null) {
          map.setFeatureState(
            { source: "parcels", id: hoveredParcelId },
            { hover: false }
          );
        }

        const feature = features[0];
        const id = feature.id as string;

        map.setFeatureState({ source: "parcels", id }, { hover: true });

        setHoveredParcelId(id);
        setStoreHoveredParcelId(feature.properties?.id || null);
      }
    });

    map.on("mouseleave", "parcels-fill", () => {
      map.getCanvas().style.cursor = "";

      if (hoveredParcelId !== null) {
        map.setFeatureState(
          { source: "parcels", id: hoveredParcelId },
          { hover: false }
        );
      }

      setHoveredParcelId(null);
      setStoreHoveredParcelId(null);
    });

    // Handle parcel click
    map.on("click", "parcels-fill", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["parcels-fill"],
      });
      if (features && features.length > 0) {
        const feature = features[0];
        const parcelId = feature.properties?.id;

        if (parcelId) {
          // Clear previous selection
          if (selectedParcelId) {
            const source = map.getSource("parcels");
            if (source && "setFeatureState" in map) {
              // Find the feature with the old selected ID and clear its state
              map.querySourceFeatures("parcels").forEach((f) => {
                if (f.properties?.id === selectedParcelId) {
                  map.setFeatureState(
                    { source: "parcels", id: f.id as string },
                    { selected: false }
                  );
                }
              });
            }
          }

          // Set new selection
          map.setFeatureState(
            { source: "parcels", id: feature.id as string },
            { selected: true }
          );

          setSelectedParcelId(parcelId);
          onParcelClick?.(parcelId);
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update parcel data when GeoJSON changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !geojsonData) return;

    const source = mapRef.current.getSource("parcels");
    if (source && "setData" in source) {
      (source as maplibregl.GeoJSONSource).setData(
        geojsonData as unknown as GeoJSON.FeatureCollection
      );
    }
  }, [geojsonData, mapLoaded]);

  // Handle external selection changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || !selectedParcelId) return;

    // Find and highlight the selected parcel
    mapRef.current.querySourceFeatures("parcels").forEach((f) => {
      const isSelected = f.properties?.id === selectedParcelId;
      mapRef.current?.setFeatureState(
        { source: "parcels", id: f.id as string },
        { selected: isSelected }
      );
    });
  }, [selectedParcelId, mapLoaded]);

  // Method to fly to a specific parcel
  const flyToParcel = useCallback(
    (coordinates: [number, number], zoom = 16) => {
      if (!mapRef.current) return;

      mapRef.current.flyTo({
        center: coordinates,
        zoom,
        duration: 1500,
      });
    },
    []
  );

  // Method to fit map to bounds
  const fitToBounds = useCallback((bounds: LngLatBoundsLike, padding = 50) => {
    if (!mapRef.current) return;

    mapRef.current.fitBounds(bounds, {
      padding,
      duration: 1000,
    });
  }, []);

  return (
    <div
      className={`relative w-full h-full ${className || ""}`}
      style={{ minHeight: "400px" }}
    >
      <div
        ref={mapContainer}
        className="absolute inset-0"
        style={{ width: "100%", height: "100%" }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-10">
          <Spinner size="sm" />
          <span className="text-sm">Loading parcels...</span>
        </div>
      )}

      {/* Parcel count indicator */}
      {geojsonData && !isLoading && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-10">
          <span className="text-sm font-medium">
            {geojsonData.features.length} parcels in view
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-8 right-4 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg z-10">
        <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
          Zoning Types
        </h4>
        <div className="space-y-1">
          {Object.entries(ZONING_COLORS).map(([zone, color]) => (
            <div key={zone} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs capitalize">
                {zone.toLowerCase().replace("_", " ")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MapView;
