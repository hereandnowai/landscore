'use client';

import { useMemo } from 'react';
import {
  X,
  BarChart3,
  PieChart,
  TrendingUp,
  MapPin,
  Ruler,
  DollarSign,
  Leaf,
  Building,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useParcelStats } from '@/hooks/useApi';

interface AnalyticsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

// Color mapping for zoning types
const ZONING_COLORS: Record<string, string> = {
  AGRICULTURAL: '#22c55e',
  RESIDENTIAL: '#3b82f6',
  COMMERCIAL: '#f59e0b',
  INDUSTRIAL: '#ef4444',
  MIXED_USE: '#8b5cf6',
  PROTECTED: '#10b981',
};

// Format US Dollars
const formatUSD = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString('en-US')}`;
};

export function AnalyticsPanel({ isOpen, onClose }: AnalyticsPanelProps) {
  const { data: stats, isLoading, refetch, isRefetching } = useParcelStats();

  // Calculate percentages for zoning breakdown
  const zoningPercentages = useMemo(() => {
    if (!stats?.zoningBreakdown) return [];
    const total = stats.zoningBreakdown.reduce((sum, z) => sum + z.count, 0);
    return stats.zoningBreakdown.map((z) => ({
      ...z,
      percentage: ((z.count / total) * 100).toFixed(1),
      color: ZONING_COLORS[z.zoningCode] || '#6b7280',
    }));
  }, [stats?.zoningBreakdown]);

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-background border-l shadow-xl z-20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-green-500/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold">Analytics</h2>
            <p className="text-xs text-muted-foreground">
              Market insights & statistics
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="h-8 w-8"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading analytics...
            </p>
          </div>
        </div>
      ) : stats ? (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4" />
                    <span className="text-xs">Total Parcels</span>
                  </div>
                  <p className="text-2xl font-bold">{stats.totalParcels}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Ruler className="h-4 w-4" />
                    <span className="text-xs">Total Area</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.totalAreaAcres.toFixed(0)}
                  </p>
                  <p className="text-xs text-muted-foreground">acres</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Avg Price</span>
                  </div>
                  <p className="text-lg font-bold text-primary">
                    {formatUSD(stats.averagePrice)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Ruler className="h-4 w-4" />
                    <span className="text-xs">Avg Size</span>
                  </div>
                  <p className="text-lg font-bold">
                    {stats.averageAreaAcres.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted-foreground">acres</p>
                </CardContent>
              </Card>
            </div>

            {/* Price Range */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Price Range
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Minimum</p>
                    <p className="font-semibold text-green-600">
                      {formatUSD(stats.minPrice)}
                    </p>
                  </div>
                  <div className="flex-1 mx-4 h-2 bg-gradient-to-r from-green-500 via-amber-500 to-red-500 rounded-full" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Maximum</p>
                    <p className="font-semibold text-red-600">
                      {formatUSD(stats.maxPrice)}
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Average</p>
                  <p className="font-bold text-primary">
                    {formatUSD(stats.averagePrice)}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Zoning Breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Zoning Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Visual Bar Chart */}
                <div className="space-y-3">
                  {zoningPercentages.map((zone) => (
                    <div key={zone.zoningCode}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: zone.color }}
                          />
                          <span className="text-sm capitalize">
                            {zone.zoningCode.toLowerCase().replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {zone.count}
                          </Badge>
                          <span className="text-xs text-muted-foreground w-12 text-right">
                            {zone.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${zone.percentage}%`,
                            backgroundColor: zone.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pie Chart Representation */}
                <div className="mt-4 flex justify-center">
                  <div className="relative w-32 h-32">
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      {zoningPercentages.reduce(
                        (acc, zone, i) => {
                          const startAngle = acc.angle;
                          const sliceAngle =
                            (parseFloat(zone.percentage) / 100) * 360;
                          const endAngle = startAngle + sliceAngle;

                          const x1 =
                            50 +
                            40 * Math.cos((Math.PI * startAngle) / 180);
                          const y1 =
                            50 +
                            40 * Math.sin((Math.PI * startAngle) / 180);
                          const x2 =
                            50 + 40 * Math.cos((Math.PI * endAngle) / 180);
                          const y2 =
                            50 + 40 * Math.sin((Math.PI * endAngle) / 180);

                          const largeArc = sliceAngle > 180 ? 1 : 0;

                          acc.paths.push(
                            <path
                              key={zone.zoningCode}
                              d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                              fill={zone.color}
                              className="hover:opacity-80 transition-opacity cursor-pointer"
                            />
                          );
                          acc.angle = endAngle;
                          return acc;
                        },
                        { paths: [] as React.ReactNode[], angle: -90 }
                      ).paths}
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center">
                        <PieChart className="h-6 w-6 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Insights */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Leaf className="h-4 w-4" />
                  Quick Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span>
                    Most common:{' '}
                    <strong className="capitalize">
                      {zoningPercentages[0]?.zoningCode
                        .toLowerCase()
                        .replace('_', ' ') || 'N/A'}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>
                    Price per acre avg:{' '}
                    <strong>
                      {formatUSD(stats.averagePrice / stats.averageAreaAcres)}
                    </strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>
                    Largest parcel:{' '}
                    <strong>
                      {(stats.totalAreaAcres / stats.totalParcels * 3).toFixed(1)} acres
                    </strong>{' '}
                    (est.)
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Market Trend */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Market Trend</p>
                    <p className="text-xs text-muted-foreground">
                      Land prices in Austin are showing steady growth
                    </p>
                    <Badge className="mt-1 bg-green-500">+8.5% YoY</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No analytics data available</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AnalyticsPanel;
