'use client';

import { useState, useCallback } from 'react';
import { MapView } from '@/components/map/MapView';
import { SearchSidebar } from '@/components/sidebar/SearchSidebar';
import { ParcelDetailsPanel } from '@/components/details/ParcelDetailsPanel';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { AnalyticsPanel } from '@/components/analytics/AnalyticsPanel';
import { DrawingTools, type DrawingMode } from '@/components/tools/DrawingTools';
import { Header } from '@/components/layout/Header';
import { useMapStore } from '@/store/mapStore';

interface DrawnShape {
  id: string;
  type: 'polygon' | 'rectangle' | 'circle';
  name: string;
  coordinates: number[][];
  area?: number;
  createdAt: Date;
}

interface Measurement {
  id: string;
  type: 'distance' | 'area';
  value: number;
  unit: string;
  points: number[][];
}

export function Dashboard() {
  const [searchOpen, setSearchOpen] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [drawingOpen, setDrawingOpen] = useState(false);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('select');
  const [drawnShapes, setDrawnShapes] = useState<DrawnShape[]>([]);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  
  const { selectedParcelId, setSelectedParcelId } = useMapStore();

  // Handle parcel selection from map or sidebar
  const handleParcelSelect = useCallback((parcelId: string) => {
    setSelectedParcelId(parcelId);
    setDetailsOpen(true);
    setChatOpen(false);
    setAnalyticsOpen(false);
  }, [setSelectedParcelId]);

  // Close details panel
  const handleCloseDetails = useCallback(() => {
    setDetailsOpen(false);
    setSelectedParcelId(null);
  }, [setSelectedParcelId]);

  // Handle shape operations
  const handleDeleteShape = useCallback((id: string) => {
    setDrawnShapes((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const handleSaveShape = useCallback((shape: DrawnShape) => {
    setDrawnShapes((prev) =>
      prev.map((s) => (s.id === shape.id ? shape : s))
    );
  }, []);

  const handleClearMeasurements = useCallback(() => {
    setMeasurements([]);
  }, []);

  // Toggle handlers that close other panels
  const handleToggleChat = useCallback(() => {
    setChatOpen((prev) => !prev);
    if (!chatOpen) {
      setAnalyticsOpen(false);
      setDetailsOpen(false);
    }
  }, [chatOpen]);

  const handleToggleAnalytics = useCallback(() => {
    setAnalyticsOpen((prev) => !prev);
    if (!analyticsOpen) {
      setChatOpen(false);
      setDetailsOpen(false);
    }
  }, [analyticsOpen]);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <Header 
        onToggleSearch={() => setSearchOpen(!searchOpen)}
        onToggleChat={handleToggleChat}
        onToggleAnalytics={handleToggleAnalytics}
        onToggleDrawing={() => setDrawingOpen(!drawingOpen)}
        searchOpen={searchOpen}
        chatOpen={chatOpen}
        analyticsOpen={analyticsOpen}
        drawingOpen={drawingOpen}
      />
      
      {/* Main Content */}
      <div className="flex-1 relative">
        {/* Map */}
        <MapView 
          onParcelClick={handleParcelSelect}
          className="w-full h-full"
        />
        
        {/* Search Sidebar */}
        <SearchSidebar 
          isOpen={searchOpen}
          onToggle={() => setSearchOpen(!searchOpen)}
          onParcelSelect={handleParcelSelect}
        />

        {/* Drawing Tools */}
        <DrawingTools
          isOpen={drawingOpen}
          onClose={() => setDrawingOpen(false)}
          activeMode={drawingMode}
          onModeChange={setDrawingMode}
          drawnShapes={drawnShapes}
          onDeleteShape={handleDeleteShape}
          onSaveShape={handleSaveShape}
          measurements={measurements}
          onClearMeasurements={handleClearMeasurements}
        />
        
        {/* Parcel Details Panel */}
        <ParcelDetailsPanel 
          parcelId={selectedParcelId}
          isOpen={detailsOpen && !chatOpen && !analyticsOpen}
          onClose={handleCloseDetails}
        />
        
        {/* Chat Panel */}
        <ChatPanel
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
        />

        {/* Analytics Panel */}
        <AnalyticsPanel
          isOpen={analyticsOpen}
          onClose={() => setAnalyticsOpen(false)}
        />
      </div>
    </div>
  );
}

export default Dashboard;
