'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { parcelApi, chatApi, type BBoxQuery, type ParcelSearchParams } from '@/lib/api';
import { useMapStore } from '@/store/mapStore';

/**
 * Hook to fetch parcels GeoJSON for map display
 */
export function useParcelsGeoJSON(bbox: BBoxQuery | null, enabled = true) {
  return useQuery({
    queryKey: ['parcels', 'geojson', bbox],
    queryFn: () => parcelApi.getGeoJSON(bbox!),
    enabled: enabled && bbox !== null,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to fetch parcel list
 */
export function useParcelsList(bbox: BBoxQuery | null) {
  return useQuery({
    queryKey: ['parcels', 'list', bbox],
    queryFn: () => parcelApi.getList(bbox!),
    enabled: bbox !== null,
    staleTime: 30 * 1000,
  });
}

/**
 * Hook to search parcels
 */
export function useParcelSearch(params: ParcelSearchParams) {
  return useQuery({
    queryKey: ['parcels', 'search', params],
    queryFn: () => parcelApi.search(params),
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch parcel details
 */
export function useParcelDetails(id: string | null) {
  return useQuery({
    queryKey: ['parcel', id],
    queryFn: () => parcelApi.getById(id!),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch parcel statistics
 */
export function useParcelStats() {
  return useQuery({
    queryKey: ['parcels', 'stats'],
    queryFn: () => parcelApi.getStats(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook for chatbot
 */
export function useChatbot() {
  const queryClient = useQueryClient();
  const { bounds, setHighlightedParcelIds } = useMapStore();

  const mutation = useMutation({
    mutationFn: async ({
      prompt,
      sessionId,
    }: {
      prompt: string;
      sessionId?: string;
    }) => {
      const viewportBounds = bounds
        ? {
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west,
          }
        : undefined;
      return chatApi.sendMessage(prompt, sessionId, viewportBounds);
    },
    onSuccess: (data) => {
      if (data.highlightedParcels) {
        setHighlightedParcelIds(data.highlightedParcels);
      }
      // Invalidate chat sessions cache
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
    },
  });

  return mutation;
}

/**
 * Hook to fetch chat history
 */
export function useChatHistory(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat', 'history', sessionId],
    queryFn: () => chatApi.getHistory(sessionId!),
    enabled: sessionId !== null,
  });
}

/**
 * Hook to fetch chat sessions
 */
export function useChatSessions() {
  return useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: () => chatApi.getSessions(),
    staleTime: 60 * 1000,
  });
}
