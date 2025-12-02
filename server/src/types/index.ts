/**
 * LANDSCORE API Types
 */

// ============================================
// REQUEST TYPES
// ============================================

export interface BBoxQuery {
  north: number;
  south: number;
  east: number;
  west: number;
  zoom?: number;
}

export interface ParcelSearchParams {
  minAreaAcres?: number;
  maxAreaAcres?: number;
  minPrice?: number;
  maxPrice?: number;
  zoningCodes?: string[];
  soilTypes?: string[];
  croplandClasses?: string[];
  hasWaterAccess?: boolean;
  hasRoadAccess?: boolean;
  city?: string;
  limit?: number;
  offset?: number;
}

export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// ============================================
// RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface ParcelGeoJSON {
  id: string;
  parcelId: string;
  geometry: MultiPolygon | null;
  properties: {
    address?: string;
    city?: string;
    areaSqft: number;
    areaAcres: number;
    estimatedPrice?: number;
    zoningCode?: string;
    soilType?: string;
  };
}

export interface ParcelListItem {
  id: string;
  parcelId: string;
  address?: string;
  city?: string;
  areaSqft: number;
  areaAcres: number;
  centroidLat: number;
  centroidLng: number;
  estimatedPrice?: number;
  zoningCode?: string;
}

export interface ParcelDetails {
  id: string;
  parcelId: string;
  apn?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country: string;
  areaSqft: number;
  areaAcres: number;
  areaSqm: number;
  centroidLat?: number;
  centroidLng?: number;
  geometry?: MultiPolygon;
  owner?: {
    id: string;
    name: string;
    ownerType: string;
    mailingAddress?: string;
    phone?: string;
    email?: string;
  };
  landData?: {
    soilType?: string;
    soilQuality?: number;
    croplandClass?: string;
    irrigationType?: string;
    zoningCode?: string;
    zoningDescription?: string;
    landUseCode?: string;
    elevation?: number;
    slope?: number;
    floodZone?: string;
    hasWaterAccess: boolean;
    hasRoadAccess: boolean;
    hasUtilities: boolean;
    distanceToWater?: number;
    distanceToRoad?: number;
  };
  valuations?: Array<{
    id: string;
    estimatedPrice: number;
    taxAssessedValue?: number;
    marketValue?: number;
    pricePerSqft?: number;
    pricePerAcre?: number;
    lastSaleDate?: Date;
    lastSalePrice?: number;
    valuationDate: Date;
    valuationSource?: string;
    confidence?: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// AUTH TYPES
// ============================================

export interface RegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  token: string;
  expiresIn: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ============================================
// CHATBOT TYPES
// ============================================

export interface ChatRequest {
  prompt: string;
  sessionId?: string;
  viewportBounds?: BBoxQuery;
}

export interface ChatResponse {
  message: string;
  sessionId: string;
  highlightedParcels?: string[];
  functionCalled?: {
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  };
}

// ============================================
// GEOJSON TYPES
// ============================================

export type Position = [number, number] | [number, number, number];

export interface MultiPolygon {
  type: 'MultiPolygon';
  coordinates: Position[][][];
}

export interface Feature<G = MultiPolygon, P = Record<string, unknown>> {
  type: 'Feature';
  geometry: G;
  properties: P;
}

export interface FeatureCollection<G = MultiPolygon, P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: Array<Feature<G, P>>;
}
