import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Types
export interface Parcel {
  id: string;
  parcelId: string;
  address?: string;
  city?: string;
  areaSqft: number;
  areaAcres: number;
  centroidLat: number;
  centroidLng: number;
  geometry?: GeoJSON.MultiPolygon;
  owner?: {
    name: string;
    ownerType: string;
  };
  landData?: {
    soilType?: string;
    soilQuality?: number;
    zoningCode?: string;
    croplandClass?: string;
    hasWaterAccess: boolean;
    hasRoadAccess: boolean;
  };
  valuation?: {
    estimatedPrice: number;
    pricePerAcre?: number;
    lastSaleDate?: string;
    lastSalePrice?: number;
  };
}

export interface MapViewport {
  latitude: number;
  longitude: number;
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SearchFilters {
  minAreaAcres?: number;
  maxAreaAcres?: number;
  minPrice?: number;
  maxPrice?: number;
  zoningCodes?: string[];
  soilTypes?: string[];
  croplandClasses?: string[];
  hasWaterAccess?: boolean;
  hasRoadAccess?: boolean;
}

interface MapState {
  // Viewport
  viewport: MapViewport;
  bounds: MapBounds | null;
  setViewport: (viewport: Partial<MapViewport>) => void;
  setBounds: (bounds: MapBounds) => void;
  
  // Parcels
  parcels: Parcel[];
  setParcels: (parcels: Parcel[]) => void;
  isLoadingParcels: boolean;
  setIsLoadingParcels: (loading: boolean) => void;
  
  // Selection
  selectedParcelId: string | null;
  selectedParcel: Parcel | null;
  setSelectedParcelId: (id: string | null) => void;
  setSelectedParcel: (parcel: Parcel | null) => void;
  clearSelection: () => void;
  
  // Hover
  hoveredParcelId: string | null;
  setHoveredParcelId: (id: string | null) => void;
  
  // Highlighted (from AI chat)
  highlightedParcelIds: string[];
  setHighlightedParcelIds: (ids: string[]) => void;
  addHighlightedParcelId: (id: string) => void;
  clearHighlightedParcels: () => void;
  
  // Filters
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  clearFilters: () => void;
  
  // UI State
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  isChatOpen: boolean;
  toggleChat: () => void;
  setChatOpen: (open: boolean) => void;
  
  activePanel: 'details' | 'search' | 'analytics' | null;
  setActivePanel: (panel: 'details' | 'search' | 'analytics' | null) => void;
}

// Default viewport centered on Austin, Texas
const DEFAULT_VIEWPORT: MapViewport = {
  latitude: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LAT || '30.2672'),
  longitude: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_LNG || '-97.7431'),
  zoom: parseFloat(process.env.NEXT_PUBLIC_DEFAULT_ZOOM || '11'),
  bearing: 0,
  pitch: 0,
};

export const useMapStore = create<MapState>()(
  devtools(
    (set) => ({
      // Viewport
      viewport: DEFAULT_VIEWPORT,
      bounds: null,
      setViewport: (viewport) =>
        set((state) => ({
          viewport: { ...state.viewport, ...viewport },
        })),
      setBounds: (bounds) => set({ bounds }),

      // Parcels
      parcels: [],
      setParcels: (parcels) => set({ parcels }),
      isLoadingParcels: false,
      setIsLoadingParcels: (loading) => set({ isLoadingParcels: loading }),

      // Selection
      selectedParcelId: null,
      selectedParcel: null,
      setSelectedParcelId: (id) => set({ selectedParcelId: id }),
      setSelectedParcel: (parcel) =>
        set({
          selectedParcel: parcel,
          selectedParcelId: parcel?.id || null,
        }),
      clearSelection: () =>
        set({
          selectedParcel: null,
          selectedParcelId: null,
        }),

      // Hover
      hoveredParcelId: null,
      setHoveredParcelId: (id) => set({ hoveredParcelId: id }),

      // Highlighted
      highlightedParcelIds: [],
      setHighlightedParcelIds: (ids) => set({ highlightedParcelIds: ids }),
      addHighlightedParcelId: (id) =>
        set((state) => ({
          highlightedParcelIds: [...state.highlightedParcelIds, id],
        })),
      clearHighlightedParcels: () => set({ highlightedParcelIds: [] }),

      // Filters
      filters: {},
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      clearFilters: () => set({ filters: {} }),

      // UI State
      isSidebarOpen: true,
      toggleSidebar: () =>
        set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),

      isChatOpen: false,
      toggleChat: () => set((state) => ({ isChatOpen: !state.isChatOpen })),
      setChatOpen: (open) => set({ isChatOpen: open }),

      activePanel: 'search',
      setActivePanel: (panel) => set({ activePanel: panel }),
    }),
    { name: 'landscore-map-store' }
  )
);

export default useMapStore;
