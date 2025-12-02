/**
 * LANDSCORE API Client
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Types
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

export interface ParcelFeature {
  type: 'Feature';
  id: string;
  geometry: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  } | null;
  properties: {
    id: string;
    parcelId: string;
    address?: string;
    city?: string;
    areaAcres: number;
    estimatedPrice?: number;
    zoningCode?: string;
    soilType?: string;
  };
}

export interface ParcelGeoJSON {
  type: 'FeatureCollection';
  features: ParcelFeature[];
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
  geometry?: {
    type: 'MultiPolygon';
    coordinates: number[][][][];
  };
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
    lastSaleDate?: string;
    lastSalePrice?: number;
    valuationDate: string;
    valuationSource?: string;
    confidence?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface ParcelStats {
  totalParcels: number;
  totalAreaAcres: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  averageAreaAcres: number;
  zoningBreakdown: Array<{
    zoningCode: string;
    count: number;
  }>;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  highlightedParcels?: string[];
  createdAt: string;
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

// API Response wrapper
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  count?: number;
  pagination?: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data as T;
}

// ============================================
// PARCEL API
// ============================================

export const parcelApi = {
  /**
   * Get parcels as GeoJSON for map display
   */
  async getGeoJSON(bbox: BBoxQuery): Promise<ParcelGeoJSON> {
    const params = new URLSearchParams({
      north: bbox.north.toString(),
      south: bbox.south.toString(),
      east: bbox.east.toString(),
      west: bbox.west.toString(),
      ...(bbox.zoom ? { zoom: bbox.zoom.toString() } : {}),
    });
    return fetchApi<ParcelGeoJSON>(`/parcels/bbox?${params}`);
  },

  /**
   * Get parcel list (no geometry)
   */
  async getList(bbox: BBoxQuery): Promise<ParcelListItem[]> {
    const params = new URLSearchParams({
      north: bbox.north.toString(),
      south: bbox.south.toString(),
      east: bbox.east.toString(),
      west: bbox.west.toString(),
    });
    return fetchApi<ParcelListItem[]>(`/parcels/list?${params}`);
  },

  /**
   * Search parcels with filters
   */
  async search(params: ParcelSearchParams): Promise<{
    parcels: ParcelListItem[];
    total: number;
    hasMore: boolean;
  }> {
    const response = await fetch(`${API_URL}/parcels/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await response.json();
    return {
      parcels: data.data,
      total: data.pagination.total,
      hasMore: data.pagination.hasMore,
    };
  },

  /**
   * Get parcel details by ID
   */
  async getById(id: string): Promise<ParcelDetails> {
    return fetchApi<ParcelDetails>(`/parcels/${id}`);
  },

  /**
   * Get parcels near a point
   */
  async getNearby(lat: number, lng: number, radius = 1000): Promise<ParcelListItem[]> {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    });
    return fetchApi<ParcelListItem[]>(`/parcels/nearby?${params}`);
  },

  /**
   * Get parcel statistics
   */
  async getStats(): Promise<ParcelStats> {
    return fetchApi<ParcelStats>('/parcels/stats');
  },
};

// ============================================
// AUTH API
// ============================================

export const authApi = {
  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return fetchApi<{
      user: { id: string; email: string; role: string };
      token: string;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  },

  async login(email: string, password: string) {
    return fetchApi<{
      user: { id: string; email: string; firstName?: string; lastName?: string; role: string };
      token: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe() {
    return fetchApi<{
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
    }>('/auth/me');
  },
};

// ============================================
// CHATBOT API
// ============================================

export const chatApi = {
  async sendMessage(
    prompt: string,
    sessionId?: string,
    viewportBounds?: BBoxQuery
  ): Promise<ChatResponse> {
    return fetchApi<ChatResponse>('/chatbot', {
      method: 'POST',
      body: JSON.stringify({ prompt, sessionId, viewportBounds }),
    });
  },

  async getHistory(sessionId: string): Promise<ChatMessage[]> {
    return fetchApi<ChatMessage[]>(`/chatbot/sessions/${sessionId}`);
  },

  async getSessions(): Promise<Array<{
    id: string;
    title: string;
    messageCount: number;
    createdAt: string;
  }>> {
    return fetchApi('/chatbot/sessions');
  },
};

export default { parcelApi, authApi, chatApi };
