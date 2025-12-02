import { Router, Request, Response } from 'express';
import { ParcelService } from '../services/parcelService.js';
import { asyncHandler, ApiError } from '../middleware/errorHandler.js';
import { validate } from '../middleware/errorHandler.js';
import { optionalAuth } from '../middleware/auth.js';
import { bboxQuerySchema, parcelSearchSchema, parcelIdSchema } from '../validation/schemas.js';

const router = Router();

/**
 * GET /api/parcels/bbox
 * Get parcels within a bounding box (for map display)
 */
router.get(
  '/bbox',
  optionalAuth,
  validate(bboxQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const bbox = req.query as unknown as {
      north: number;
      south: number;
      east: number;
      west: number;
      zoom?: number;
    };

    const geojson = await ParcelService.getParcelGeoJSON(bbox);

    res.json({
      success: true,
      data: geojson,
      count: geojson.features.length,
    });
  })
);

/**
 * GET /api/parcels/list
 * Get parcels list within a bounding box (simplified, no geometry)
 */
router.get(
  '/list',
  optionalAuth,
  validate(bboxQuerySchema, 'query'),
  asyncHandler(async (req: Request, res: Response) => {
    const bbox = req.query as unknown as {
      north: number;
      south: number;
      east: number;
      west: number;
    };

    const parcels = await ParcelService.getParcelsInBBox(bbox);

    res.json({
      success: true,
      data: parcels,
      count: parcels.length,
    });
  })
);

/**
 * POST /api/parcels/search
 * Search parcels with advanced filters
 */
router.post(
  '/search',
  optionalAuth,
  validate(parcelSearchSchema, 'body'),
  asyncHandler(async (req: Request, res: Response) => {
    const params = req.body;
    const { parcels, total } = await ParcelService.searchParcels(params);

    res.json({
      success: true,
      data: parcels,
      pagination: {
        total,
        limit: params.limit || 100,
        offset: params.offset || 0,
        hasMore: (params.offset || 0) + parcels.length < total,
      },
    });
  })
);

/**
 * GET /api/parcels/nearby
 * Get parcels near a point
 */
router.get(
  '/nearby',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius = 1000, limit = 20 } = req.query;

    if (!lat || !lng) {
      throw ApiError.badRequest('lat and lng are required');
    }

    const parcels = await ParcelService.getParcelsNearPoint(
      parseFloat(lng as string),
      parseFloat(lat as string),
      parseFloat(radius as string),
      parseInt(limit as string, 10)
    );

    res.json({
      success: true,
      data: parcels,
      count: parcels.length,
    });
  })
);

/**
 * GET /api/parcels/stats
 * Get parcel statistics
 */
router.get(
  '/stats',
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const stats = await ParcelService.getParcelStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * GET /api/parcels/:id
 * Get parcel details by ID
 */
router.get(
  '/:id',
  optionalAuth,
  validate(parcelIdSchema, 'params'),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const parcel = await ParcelService.getParcelById(id);

    if (!parcel) {
      throw ApiError.notFound('Parcel not found');
    }

    res.json({
      success: true,
      data: parcel,
    });
  })
);

export default router;
