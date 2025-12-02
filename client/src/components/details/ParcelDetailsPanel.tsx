'use client';

import { useMemo } from 'react';
import {
  X,
  MapPin,
  User,
  Ruler,
  DollarSign,
  Leaf,
  Building,
  Droplets,
  Route,
  Zap,
  Mountain,
  AlertTriangle,
  Calendar,
  Phone,
  Mail,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParcelDetails } from '@/hooks/useApi';

interface ParcelDetailsPanelProps {
  parcelId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Format US Dollars
const formatUSD = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  } else if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toLocaleString('en-US')}`;
};

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export function ParcelDetailsPanel({
  parcelId,
  isOpen,
  onClose,
}: ParcelDetailsPanelProps) {
  const { data: parcel, isLoading, error } = useParcelDetails(parcelId);

  // Get latest valuation
  const latestValuation = useMemo(() => {
    if (!parcel?.valuations?.length) return null;
    return parcel.valuations.sort(
      (a, b) =>
        new Date(b.valuationDate).getTime() -
        new Date(a.valuationDate).getTime()
    )[0];
  }, [parcel?.valuations]);

  if (!isOpen || !parcelId) {
    return null;
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-background border-l shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-primary/5">
        <div>
          <h2 className="font-semibold">Parcel Details</h2>
          {parcel && (
            <p className="text-sm text-muted-foreground">{parcel.parcelId}</p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Spinner size="lg" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading parcel details...
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-destructive">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>Failed to load parcel details</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          </div>
        </div>
      ) : parcel ? (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Ruler className="h-4 w-4" />
                    <span className="text-xs">Area</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {parcel.areaAcres.toFixed(2)} ac
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {parcel.areaSqft.toLocaleString()} sq ft
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-xs">Est. Value</span>
                  </div>
                  <p className="text-lg font-semibold text-primary">
                    {latestValuation
                      ? formatUSD(latestValuation.estimatedPrice)
                      : 'N/A'}
                  </p>
                  {latestValuation?.pricePerAcre && (
                    <p className="text-xs text-muted-foreground">
                      {formatUSD(latestValuation.pricePerAcre)}/ac
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="location" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="location" className="flex-1">
                  Location
                </TabsTrigger>
                <TabsTrigger value="land" className="flex-1">
                  Land Data
                </TabsTrigger>
                <TabsTrigger value="valuation" className="flex-1">
                  Valuation
                </TabsTrigger>
              </TabsList>

              {/* Location Tab */}
              <TabsContent value="location" className="space-y-4 mt-4">
                {/* Address */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {parcel.address && <p>{parcel.address}</p>}
                    <p>
                      {parcel.city}, {parcel.state} {parcel.zipCode}
                    </p>
                    <p className="text-muted-foreground">{parcel.country}</p>
                    {parcel.apn && (
                      <p className="text-muted-foreground">APN: {parcel.apn}</p>
                    )}
                  </CardContent>
                </Card>

                {/* Owner Info */}
                {parcel.owner && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Owner
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{parcel.owner.name}</span>
                        <Badge variant="outline">{parcel.owner.ownerType}</Badge>
                      </div>
                      {parcel.owner.mailingAddress && (
                        <p className="text-muted-foreground">
                          {parcel.owner.mailingAddress}
                        </p>
                      )}
                      {parcel.owner.phone && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {parcel.owner.phone}
                        </p>
                      )}
                      {parcel.owner.email && (
                        <p className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {parcel.owner.email}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Coordinates */}
                {parcel.centroidLat && parcel.centroidLng && (
                  <Card>
                    <CardContent className="p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        Coordinates
                      </p>
                      <p className="text-sm font-mono">
                        {parcel.centroidLat.toFixed(6)},{' '}
                        {parcel.centroidLng.toFixed(6)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Land Data Tab */}
              <TabsContent value="land" className="space-y-4 mt-4">
                {parcel.landData ? (
                  <>
                    {/* Zoning */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Zoning & Land Use
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Zoning</span>
                          <Badge>{parcel.landData.zoningCode || 'N/A'}</Badge>
                        </div>
                        {parcel.landData.zoningDescription && (
                          <p className="text-xs text-muted-foreground">
                            {parcel.landData.zoningDescription}
                          </p>
                        )}
                        {parcel.landData.landUseCode && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Land Use
                            </span>
                            <span>{parcel.landData.landUseCode}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Soil & Cropland */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Leaf className="h-4 w-4" />
                          Soil & Agriculture
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {parcel.landData.soilType && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Soil Type
                            </span>
                            <span>{parcel.landData.soilType}</span>
                          </div>
                        )}
                        {parcel.landData.soilQuality && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Soil Quality
                            </span>
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={
                                    star <= parcel.landData!.soilQuality!
                                      ? 'text-amber-500'
                                      : 'text-gray-300'
                                  }
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {parcel.landData.croplandClass && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Cropland Class
                            </span>
                            <Badge variant="secondary">
                              {parcel.landData.croplandClass}
                            </Badge>
                          </div>
                        )}
                        {parcel.landData.irrigationType && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Irrigation
                            </span>
                            <span>{parcel.landData.irrigationType}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Terrain */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Mountain className="h-4 w-4" />
                          Terrain
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        {parcel.landData.elevation !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Elevation
                            </span>
                            <span>{parcel.landData.elevation}m</span>
                          </div>
                        )}
                        {parcel.landData.slope !== undefined && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Slope</span>
                            <span>{parcel.landData.slope}°</span>
                          </div>
                        )}
                        {parcel.landData.floodZone && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              Flood Zone
                            </span>
                            <Badge
                              variant={
                                parcel.landData.floodZone === 'X'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {parcel.landData.floodZone}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Access & Utilities */}
                    <Card>
                      <CardContent className="p-3">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div
                            className={`p-2 rounded-lg ${
                              parcel.landData.hasWaterAccess
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Droplets className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">Water</span>
                          </div>
                          <div
                            className={`p-2 rounded-lg ${
                              parcel.landData.hasRoadAccess
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Route className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">Road</span>
                          </div>
                          <div
                            className={`p-2 rounded-lg ${
                              parcel.landData.hasUtilities
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            <Zap className="h-5 w-5 mx-auto mb-1" />
                            <span className="text-xs">Utilities</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Leaf className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No land data available</p>
                  </div>
                )}
              </TabsContent>

              {/* Valuation Tab */}
              <TabsContent value="valuation" className="space-y-4 mt-4">
                {parcel.valuations && parcel.valuations.length > 0 ? (
                  <>
                    {/* Latest Valuation Summary */}
                    {latestValuation && (
                      <Card className="border-primary/50">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <TrendingUp className="h-4 w-4" />
                            Latest Valuation
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="text-center py-2">
                            <p className="text-3xl font-bold text-primary">
                              {formatUSD(latestValuation.estimatedPrice)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              As of {formatDate(latestValuation.valuationDate)}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {latestValuation.pricePerSqft && (
                              <div className="bg-muted/50 p-2 rounded">
                                <p className="text-muted-foreground">
                                  Per Sq Ft
                                </p>
                                <p className="font-medium">
                                  {formatUSD(latestValuation.pricePerSqft)}
                                </p>
                              </div>
                            )}
                            {latestValuation.pricePerAcre && (
                              <div className="bg-muted/50 p-2 rounded">
                                <p className="text-muted-foreground">
                                  Per Acre
                                </p>
                                <p className="font-medium">
                                  {formatUSD(latestValuation.pricePerAcre)}
                                </p>
                              </div>
                            )}
                            {latestValuation.taxAssessedValue && (
                              <div className="bg-muted/50 p-2 rounded">
                                <p className="text-muted-foreground">
                                  Tax Assessed
                                </p>
                                <p className="font-medium">
                                  {formatUSD(latestValuation.taxAssessedValue)}
                                </p>
                              </div>
                            )}
                            {latestValuation.marketValue && (
                              <div className="bg-muted/50 p-2 rounded">
                                <p className="text-muted-foreground">
                                  Market Value
                                </p>
                                <p className="font-medium">
                                  {formatUSD(latestValuation.marketValue)}
                                </p>
                              </div>
                            )}
                          </div>

                          {latestValuation.confidence && (
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">
                                Confidence
                              </span>
                              <div className="flex items-center gap-1">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary"
                                    style={{
                                      width: `${latestValuation.confidence}%`,
                                    }}
                                  />
                                </div>
                                <span className="text-xs">
                                  {latestValuation.confidence}%
                                </span>
                              </div>
                            </div>
                          )}

                          {latestValuation.valuationSource && (
                            <p className="text-xs text-muted-foreground">
                              Source: {latestValuation.valuationSource}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Sale History */}
                    {latestValuation?.lastSaleDate && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Last Sale
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Date</span>
                            <span>
                              {formatDate(latestValuation.lastSaleDate)}
                            </span>
                          </div>
                          {latestValuation.lastSalePrice && (
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-muted-foreground">
                                Price
                              </span>
                              <span className="font-medium">
                                {formatUSD(latestValuation.lastSalePrice)}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Valuation History */}
                    {parcel.valuations.length > 1 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">
                            Valuation History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {parcel.valuations.map((val) => (
                              <div
                                key={val.id}
                                className="flex items-center justify-between py-1 border-b last:border-0"
                              >
                                <span className="text-sm text-muted-foreground">
                                  {formatDate(val.valuationDate)}
                                </span>
                                <span className="font-medium">
                                  {formatUSD(val.estimatedPrice)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No valuation data available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
      ) : null}
    </div>
  );
}

export default ParcelDetailsPanel;
