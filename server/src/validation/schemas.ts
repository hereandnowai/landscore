import { z } from 'zod';

// ============================================
// PARCEL VALIDATION SCHEMAS
// ============================================

export const bboxQuerySchema = z.object({
  north: z.coerce.number().min(-90).max(90),
  south: z.coerce.number().min(-90).max(90),
  east: z.coerce.number().min(-180).max(180),
  west: z.coerce.number().min(-180).max(180),
  zoom: z.coerce.number().min(0).max(22).optional(),
});

export const parcelSearchSchema = z.object({
  minAreaAcres: z.coerce.number().min(0).optional(),
  maxAreaAcres: z.coerce.number().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  zoningCodes: z.array(z.string()).or(z.string().transform(s => s.split(','))).optional(),
  soilTypes: z.array(z.string()).or(z.string().transform(s => s.split(','))).optional(),
  croplandClasses: z.array(z.string()).or(z.string().transform(s => s.split(','))).optional(),
  hasWaterAccess: z.coerce.boolean().optional(),
  hasRoadAccess: z.coerce.boolean().optional(),
  city: z.string().optional(),
  limit: z.coerce.number().min(1).max(500).default(100),
  offset: z.coerce.number().min(0).default(0),
});

export const parcelIdSchema = z.object({
  id: z.string().min(1),
});

// ============================================
// AUTH VALIDATION SCHEMAS
// ============================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ============================================
// CHATBOT VALIDATION SCHEMAS
// ============================================

export const chatRequestSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required').max(2000, 'Prompt too long'),
  sessionId: z.string().optional(),
  viewportBounds: bboxQuerySchema.optional(),
});

// ============================================
// SAVED ITEMS VALIDATION SCHEMAS
// ============================================

export const savedSearchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: parcelSearchSchema,
});

export const savedParcelSchema = z.object({
  parcelId: z.string().min(1),
  notes: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const savedShapeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  shapeType: z.enum(['POLYGON', 'CIRCLE', 'RECTANGLE']),
  geometryJson: z.string(),
  centerLat: z.number().optional(),
  centerLng: z.number().optional(),
  radiusMeters: z.number().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type BBoxQuery = z.infer<typeof bboxQuerySchema>;
export type ParcelSearchParams = z.infer<typeof parcelSearchSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SavedSearchRequest = z.infer<typeof savedSearchSchema>;
export type SavedParcelRequest = z.infer<typeof savedParcelSchema>;
export type SavedShapeRequest = z.infer<typeof savedShapeSchema>;
