import prisma from '../lib/prisma.js';
import type { BBoxQuery, ParcelSearchParams, ParcelDetails, ParcelListItem, MultiPolygon } from '../types/index.js';

/**
 * Parcel Service - Handles all parcel-related database operations
 */
export class ParcelService {
  /**
   * Get parcels within a bounding box using PostGIS
   */
  static async getParcelsInBBox(bbox: BBoxQuery): Promise<ParcelListItem[]> {
    const { north, south, east, west } = bbox;

    // Use raw SQL for PostGIS spatial query
    const parcels = await prisma.$queryRawUnsafe<Array<{
      id: string;
      parcel_id: string;
      address: string | null;
      city: string | null;
      area_sqft: number;
      area_acres: number;
      centroid_lat: number | null;
      centroid_lng: number | null;
      estimated_price: number | null;
      zoning_code: string | null;
    }>>(`
      SELECT 
        p.id,
        p.parcel_id,
        p.address,
        p.city,
        p.area_sqft,
        p.area_acres,
        p.centroid_lat,
        p.centroid_lng,
        v.estimated_price,
        ld.zoning_code
      FROM parcels p
      LEFT JOIN LATERAL (
        SELECT estimated_price 
        FROM valuations 
        WHERE parcel_id = p.id 
        ORDER BY valuation_date DESC 
        LIMIT 1
      ) v ON true
      LEFT JOIN land_data ld ON ld.parcel_id = p.id
      WHERE p.geometry && ST_MakeEnvelope($1, $2, $3, $4, 4326)
      LIMIT 500
    `, west, south, east, north);

    return parcels.map((p) => ({
      id: p.id,
      parcelId: p.parcel_id,
      address: p.address || undefined,
      city: p.city || undefined,
      areaSqft: p.area_sqft,
      areaAcres: p.area_acres,
      centroidLat: p.centroid_lat || 0,
      centroidLng: p.centroid_lng || 0,
      estimatedPrice: p.estimated_price || undefined,
      zoningCode: p.zoning_code || undefined,
    }));
  }

  /**
   * Get GeoJSON features for parcels in a bounding box
   */
  static async getParcelGeoJSON(bbox: BBoxQuery) {
    const { north, south, east, west, zoom = 12 } = bbox;

    // Simplify geometry based on zoom level
    const tolerance = zoom < 10 ? 0.001 : zoom < 14 ? 0.0001 : 0.00001;

    const features = await prisma.$queryRawUnsafe<Array<{
      id: string;
      parcel_id: string;
      geojson: string;
      address: string | null;
      city: string | null;
      area_acres: number;
      estimated_price: number | null;
      zoning_code: string | null;
      soil_type: string | null;
    }>>(`
      SELECT 
        p.id,
        p.parcel_id,
        ST_AsGeoJSON(ST_SimplifyPreserveTopology(p.geometry, $1)) as geojson,
        p.address,
        p.city,
        p.area_acres,
        v.estimated_price,
        ld.zoning_code,
        ld.soil_type
      FROM parcels p
      LEFT JOIN LATERAL (
        SELECT estimated_price 
        FROM valuations 
        WHERE parcel_id = p.id 
        ORDER BY valuation_date DESC 
        LIMIT 1
      ) v ON true
      LEFT JOIN land_data ld ON ld.parcel_id = p.id
      WHERE p.geometry && ST_MakeEnvelope($2, $3, $4, $5, 4326)
      LIMIT 500
    `, tolerance, west, south, east, north);

    return {
      type: 'FeatureCollection' as const,
      features: features.map((f) => ({
        type: 'Feature' as const,
        id: f.id,
        geometry: f.geojson ? JSON.parse(f.geojson) : null,
        properties: {
          id: f.id,
          parcelId: f.parcel_id,
          parcelNumber: f.parcel_id,
          address: f.address,
          city: f.city,
          areaAcres: f.area_acres,
          estimatedPrice: f.estimated_price,
          zoning: f.zoning_code,
          zoningCode: f.zoning_code,
          soilType: f.soil_type,
        },
      })),
    };
  }

  /**
   * Get parcel by ID with full details
   */
  static async getParcelById(id: string): Promise<ParcelDetails | null> {
    const parcel = await prisma.parcel.findUnique({
      where: { id },
      include: {
        owner: true,
        landData: true,
        valuations: {
          orderBy: { valuationDate: 'desc' },
          take: 5,
        },
      },
    });

    if (!parcel) return null;

    // Get geometry as GeoJSON
    const geometryResult = await prisma.$queryRawUnsafe<Array<{ geojson: string }>>(`
      SELECT ST_AsGeoJSON(geometry) as geojson 
      FROM parcels 
      WHERE id = $1
    `, id);

    const geometry = geometryResult[0]?.geojson 
      ? JSON.parse(geometryResult[0].geojson) as MultiPolygon
      : undefined;

    return {
      id: parcel.id,
      parcelId: parcel.parcelId,
      apn: parcel.apn || undefined,
      address: parcel.address || undefined,
      city: parcel.city || undefined,
      state: parcel.state || undefined,
      zipCode: parcel.zipCode || undefined,
      country: parcel.country,
      areaSqft: parcel.areaSqft,
      areaAcres: parcel.areaAcres,
      areaSqm: parcel.areaSqm,
      centroidLat: parcel.centroidLat || undefined,
      centroidLng: parcel.centroidLng || undefined,
      geometry,
      owner: parcel.owner ? {
        id: parcel.owner.id,
        name: parcel.owner.name,
        ownerType: parcel.owner.ownerType,
        mailingAddress: parcel.owner.mailingAddress || undefined,
        phone: parcel.owner.phone || undefined,
        email: parcel.owner.email || undefined,
      } : undefined,
      landData: parcel.landData ? {
        soilType: parcel.landData.soilType || undefined,
        soilQuality: parcel.landData.soilQuality || undefined,
        croplandClass: parcel.landData.croplandClass || undefined,
        irrigationType: parcel.landData.irrigationType || undefined,
        zoningCode: parcel.landData.zoningCode || undefined,
        zoningDescription: parcel.landData.zoningDescription || undefined,
        landUseCode: parcel.landData.landUseCode || undefined,
        elevation: parcel.landData.elevation || undefined,
        slope: parcel.landData.slope || undefined,
        floodZone: parcel.landData.floodZone || undefined,
        hasWaterAccess: parcel.landData.hasWaterAccess,
        hasRoadAccess: parcel.landData.hasRoadAccess,
        hasUtilities: parcel.landData.hasUtilities,
        distanceToWater: parcel.landData.distanceToWater || undefined,
        distanceToRoad: parcel.landData.distanceToRoad || undefined,
      } : undefined,
      valuations: parcel.valuations.map((v) => ({
        id: v.id,
        estimatedPrice: v.estimatedPrice,
        taxAssessedValue: v.taxAssessedValue || undefined,
        marketValue: v.marketValue || undefined,
        pricePerSqft: v.pricePerSqft || undefined,
        pricePerAcre: v.pricePerAcre || undefined,
        lastSaleDate: v.lastSaleDate || undefined,
        lastSalePrice: v.lastSalePrice || undefined,
        valuationDate: v.valuationDate,
        valuationSource: v.valuationSource || undefined,
        confidence: v.confidence || undefined,
      })),
      createdAt: parcel.createdAt,
      updatedAt: parcel.updatedAt,
    };
  }

  /**
   * Search parcels with advanced filters
   */
  static async searchParcels(params: ParcelSearchParams): Promise<{
    parcels: ParcelListItem[];
    total: number;
  }> {
    const {
      minAreaAcres,
      maxAreaAcres,
      minPrice,
      maxPrice,
      zoningCodes,
      soilTypes,
      croplandClasses,
      hasWaterAccess,
      hasRoadAccess,
      city,
      limit = 100,
      offset = 0,
    } = params;

    // Build WHERE conditions dynamically
    const conditions: string[] = ['1=1'];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (minAreaAcres !== undefined) {
      conditions.push(`p.area_acres >= $${paramIndex++}`);
      values.push(minAreaAcres);
    }
    if (maxAreaAcres !== undefined) {
      conditions.push(`p.area_acres <= $${paramIndex++}`);
      values.push(maxAreaAcres);
    }
    if (minPrice !== undefined) {
      conditions.push(`v.estimated_price >= $${paramIndex++}`);
      values.push(minPrice);
    }
    if (maxPrice !== undefined) {
      conditions.push(`v.estimated_price <= $${paramIndex++}`);
      values.push(maxPrice);
    }
    if (zoningCodes && zoningCodes.length > 0) {
      conditions.push(`ld.zoning_code = ANY($${paramIndex++})`);
      values.push(zoningCodes);
    }
    if (soilTypes && soilTypes.length > 0) {
      conditions.push(`ld.soil_type = ANY($${paramIndex++})`);
      values.push(soilTypes);
    }
    if (croplandClasses && croplandClasses.length > 0) {
      conditions.push(`ld.cropland_class = ANY($${paramIndex++})`);
      values.push(croplandClasses);
    }
    if (hasWaterAccess !== undefined) {
      conditions.push(`ld.has_water_access = $${paramIndex++}`);
      values.push(hasWaterAccess);
    }
    if (hasRoadAccess !== undefined) {
      conditions.push(`ld.has_road_access = $${paramIndex++}`);
      values.push(hasRoadAccess);
    }
    if (city) {
      conditions.push(`LOWER(p.city) LIKE LOWER($${paramIndex++})`);
      values.push(`%${city}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM parcels p
      LEFT JOIN land_data ld ON ld.parcel_id = p.id
      LEFT JOIN LATERAL (
        SELECT estimated_price 
        FROM valuations 
        WHERE parcel_id = p.id 
        ORDER BY valuation_date DESC 
        LIMIT 1
      ) v ON true
      WHERE ${whereClause}
    `, ...values);

    const total = Number(countResult[0].count);

    // Get parcels with limit and offset
    const parcels = await prisma.$queryRawUnsafe<Array<{
      id: string;
      parcel_id: string;
      address: string | null;
      city: string | null;
      area_sqft: number;
      area_acres: number;
      centroid_lat: number | null;
      centroid_lng: number | null;
      estimated_price: number | null;
      zoning_code: string | null;
    }>>(`
      SELECT 
        p.id,
        p.parcel_id,
        p.address,
        p.city,
        p.area_sqft,
        p.area_acres,
        p.centroid_lat,
        p.centroid_lng,
        v.estimated_price,
        ld.zoning_code
      FROM parcels p
      LEFT JOIN land_data ld ON ld.parcel_id = p.id
      LEFT JOIN LATERAL (
        SELECT estimated_price 
        FROM valuations 
        WHERE parcel_id = p.id 
        ORDER BY valuation_date DESC 
        LIMIT 1
      ) v ON true
      WHERE ${whereClause}
      ORDER BY v.estimated_price DESC NULLS LAST
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++}
    `, ...values, limit, offset);

    return {
      parcels: parcels.map((p) => ({
        id: p.id,
        parcelId: p.parcel_id,
        address: p.address || undefined,
        city: p.city || undefined,
        areaSqft: p.area_sqft,
        areaAcres: p.area_acres,
        centroidLat: p.centroid_lat || 0,
        centroidLng: p.centroid_lng || 0,
        estimatedPrice: p.estimated_price || undefined,
        zoningCode: p.zoning_code || undefined,
      })),
      total,
    };
  }

  /**
   * Get parcels near a point
   */
  static async getParcelsNearPoint(
    lng: number,
    lat: number,
    radiusMeters: number,
    limit = 20
  ): Promise<Array<ParcelListItem & { distanceMeters: number }>> {
    const parcels = await prisma.$queryRawUnsafe<Array<{
      id: string;
      parcel_id: string;
      address: string | null;
      city: string | null;
      area_sqft: number;
      area_acres: number;
      centroid_lat: number | null;
      centroid_lng: number | null;
      estimated_price: number | null;
      zoning_code: string | null;
      distance_meters: number;
    }>>(`
      SELECT 
        p.id,
        p.parcel_id,
        p.address,
        p.city,
        p.area_sqft,
        p.area_acres,
        p.centroid_lat,
        p.centroid_lng,
        v.estimated_price,
        ld.zoning_code,
        ST_Distance(
          p.geometry::geography,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
        ) as distance_meters
      FROM parcels p
      LEFT JOIN land_data ld ON ld.parcel_id = p.id
      LEFT JOIN LATERAL (
        SELECT estimated_price 
        FROM valuations 
        WHERE parcel_id = p.id 
        ORDER BY valuation_date DESC 
        LIMIT 1
      ) v ON true
      WHERE ST_DWithin(
        p.geometry::geography,
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        $3
      )
      ORDER BY distance_meters
      LIMIT $4
    `, lng, lat, radiusMeters, limit);

    return parcels.map((p) => ({
      id: p.id,
      parcelId: p.parcel_id,
      address: p.address || undefined,
      city: p.city || undefined,
      areaSqft: p.area_sqft,
      areaAcres: p.area_acres,
      centroidLat: p.centroid_lat || 0,
      centroidLng: p.centroid_lng || 0,
      estimatedPrice: p.estimated_price || undefined,
      zoningCode: p.zoning_code || undefined,
      distanceMeters: p.distance_meters,
    }));
  }

  /**
   * Get statistics for parcels (for analytics)
   */
  static async getParcelStats() {
    const stats = await prisma.$queryRawUnsafe<[{
      total_parcels: bigint;
      total_area_acres: number;
      avg_price: number;
      min_price: number;
      max_price: number;
      avg_area_acres: number;
    }]>(`
      SELECT 
        COUNT(DISTINCT p.id) as total_parcels,
        SUM(p.area_acres) as total_area_acres,
        AVG(v.estimated_price) as avg_price,
        MIN(v.estimated_price) as min_price,
        MAX(v.estimated_price) as max_price,
        AVG(p.area_acres) as avg_area_acres
      FROM parcels p
      LEFT JOIN LATERAL (
        SELECT estimated_price 
        FROM valuations 
        WHERE parcel_id = p.id 
        ORDER BY valuation_date DESC 
        LIMIT 1
      ) v ON true
    `);

    const zoningBreakdown = await prisma.$queryRawUnsafe<Array<{
      zoning_code: string;
      count: bigint;
    }>>(`
      SELECT 
        ld.zoning_code,
        COUNT(*) as count
      FROM parcels p
      JOIN land_data ld ON ld.parcel_id = p.id
      WHERE ld.zoning_code IS NOT NULL
      GROUP BY ld.zoning_code
      ORDER BY count DESC
    `);

    return {
      totalParcels: Number(stats[0].total_parcels),
      totalAreaAcres: stats[0].total_area_acres || 0,
      averagePrice: stats[0].avg_price || 0,
      minPrice: stats[0].min_price || 0,
      maxPrice: stats[0].max_price || 0,
      averageAreaAcres: stats[0].avg_area_acres || 0,
      zoningBreakdown: zoningBreakdown.map((z) => ({
        zoningCode: z.zoning_code,
        count: Number(z.count),
      })),
    };
  }
}

export default ParcelService;
