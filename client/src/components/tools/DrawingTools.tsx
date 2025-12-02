'use client';

import { useState, useCallback } from 'react';
import {
  Pencil,
  Square,
  Circle,
  Hexagon,
  Trash2,
  Download,
  Save,
  Ruler,
  X,
  ChevronDown,
  ChevronUp,
  MousePointer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type DrawingMode = 'select' | 'polygon' | 'rectangle' | 'circle' | 'measure';

interface DrawnShape {
  id: string;
  type: 'polygon' | 'rectangle' | 'circle';
  name: string;
  coordinates: number[][];
  area?: number; // in sq meters
  createdAt: Date;
}

interface Measurement {
  id: string;
  type: 'distance' | 'area';
  value: number;
  unit: string;
  points: number[][];
}

interface DrawingToolsProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  drawnShapes: DrawnShape[];
  onDeleteShape: (id: string) => void;
  onSaveShape: (shape: DrawnShape) => void;
  measurements: Measurement[];
  onClearMeasurements: () => void;
}

// Format area for display
const formatArea = (sqMeters: number) => {
  const acres = sqMeters / 4046.86;
  if (acres >= 1) {
    return `${acres.toFixed(2)} acres`;
  }
  return `${sqMeters.toFixed(0)} m²`;
};

// Format distance for display
const formatDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  return `${meters.toFixed(0)} m`;
};

export function DrawingTools({
  isOpen,
  onClose,
  activeMode,
  onModeChange,
  drawnShapes,
  onDeleteShape,
  onSaveShape,
  measurements,
  onClearMeasurements,
}: DrawingToolsProps) {
  const [showShapes, setShowShapes] = useState(true);
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null);
  const [shapeName, setShapeName] = useState('');

  const tools = [
    { mode: 'select' as DrawingMode, icon: MousePointer, label: 'Select' },
    { mode: 'polygon' as DrawingMode, icon: Hexagon, label: 'Polygon' },
    { mode: 'rectangle' as DrawingMode, icon: Square, label: 'Rectangle' },
    { mode: 'circle' as DrawingMode, icon: Circle, label: 'Circle' },
    { mode: 'measure' as DrawingMode, icon: Ruler, label: 'Measure' },
  ];

  const handleSaveShapeName = useCallback(
    (shape: DrawnShape) => {
      if (shapeName.trim()) {
        onSaveShape({ ...shape, name: shapeName.trim() });
      }
      setEditingShapeId(null);
      setShapeName('');
    },
    [shapeName, onSaveShape]
  );

  const handleExportShapes = useCallback(() => {
    const geojson = {
      type: 'FeatureCollection',
      features: drawnShapes.map((shape) => ({
        type: 'Feature',
        properties: {
          name: shape.name,
          type: shape.type,
          area: shape.area,
          createdAt: shape.createdAt.toISOString(),
        },
        geometry: {
          type: shape.type === 'circle' ? 'Point' : 'Polygon',
          coordinates:
            shape.type === 'circle'
              ? shape.coordinates[0]
              : [shape.coordinates],
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `landscore-shapes-${new Date().toISOString().split('T')[0]}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  }, [drawnShapes]);

  if (!isOpen) return null;

  return (
    <div className="absolute left-4 top-20 z-20 w-64">
      <Card className="shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Pencil className="h-4 w-4" />
            Drawing Tools
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
            <X className="h-3 w-3" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Tool Buttons */}
          <div className="flex flex-wrap gap-1">
            <TooltipProvider>
              {tools.map((tool) => (
                <Tooltip key={tool.mode}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeMode === tool.mode ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => onModeChange(tool.mode)}
                      className="h-9 w-9"
                    >
                      <tool.icon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{tool.label}</TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>

          {/* Active Mode Indicator */}
          <div className="flex items-center gap-2 text-sm">
            <Badge
              variant={activeMode === 'select' ? 'secondary' : 'default'}
              className="capitalize"
            >
              {activeMode} mode
            </Badge>
            {activeMode !== 'select' && (
              <span className="text-xs text-muted-foreground">
                Click on map to draw
              </span>
            )}
          </div>

          {/* Drawn Shapes */}
          <div>
            <button
              onClick={() => setShowShapes(!showShapes)}
              className="w-full flex items-center justify-between py-2 text-sm font-medium"
            >
              <span>Saved Shapes ({drawnShapes.length})</span>
              {showShapes ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showShapes && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {drawnShapes.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    No shapes drawn yet. Use the tools above to draw on the map.
                  </p>
                ) : (
                  drawnShapes.map((shape) => (
                    <div
                      key={shape.id}
                      className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                    >
                      {editingShapeId === shape.id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            value={shapeName}
                            onChange={(e) => setShapeName(e.target.value)}
                            className="h-7 text-xs"
                            placeholder="Shape name"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveShapeName(shape);
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => handleSaveShapeName(shape)}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              setEditingShapeId(shape.id);
                              setShapeName(shape.name);
                            }}
                          >
                            <p className="font-medium truncate">{shape.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {shape.area ? formatArea(shape.area) : shape.type}
                            </p>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive"
                            onClick={() => onDeleteShape(shape.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  ))
                )}

                {drawnShapes.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleExportShapes}
                  >
                    <Download className="h-3 w-3 mr-2" />
                    Export GeoJSON
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Measurements */}
          <div>
            <button
              onClick={() => setShowMeasurements(!showMeasurements)}
              className="w-full flex items-center justify-between py-2 text-sm font-medium"
            >
              <span>Measurements ({measurements.length})</span>
              {showMeasurements ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showMeasurements && (
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {measurements.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-2">
                    Select measure mode and click on the map to measure
                    distances.
                  </p>
                ) : (
                  <>
                    {measurements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Ruler className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {m.type === 'distance'
                              ? formatDistance(m.value)
                              : formatArea(m.value)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {m.type}
                        </Badge>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={onClearMeasurements}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Clear All
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-xs text-muted-foreground border-t pt-2">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>Double-click to complete polygon</li>
              <li>Press Escape to cancel</li>
              <li>Click shape to select and edit</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DrawingTools;
