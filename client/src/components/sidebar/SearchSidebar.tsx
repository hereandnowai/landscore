'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  MapPin,
  Ruler,
  DollarSign,
  Leaf,
  Building,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { useParcelSearch, useParcelsList } from '@/hooks/useApi';
import { useMapStore } from '@/store/mapStore';
import type { ParcelSearchParams, ParcelListItem } from '@/lib/api';

// Available options for filters
const ZONING_OPTIONS = [
  { value: 'AGRICULTURAL', label: 'Agricultural' },
  { value: 'RESIDENTIAL', label: 'Residential' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'INDUSTRIAL', label: 'Industrial' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
  { value: 'PROTECTED', label: 'Protected' },
];

const SOIL_TYPE_OPTIONS = [
  { value: 'Alluvial', label: 'Alluvial' },
  { value: 'Black Cotton', label: 'Black Cotton' },
  { value: 'Red', label: 'Red' },
  { value: 'Laterite', label: 'Laterite' },
  { value: 'Sandy Loam', label: 'Sandy Loam' },
  { value: 'Clay Loam', label: 'Clay Loam' },
];

const CROPLAND_OPTIONS = [
  { value: 'PRIME', label: 'Prime Farmland' },
  { value: 'STATEWIDE', label: 'Statewide Importance' },
  { value: 'LOCAL', label: 'Local Importance' },
  { value: 'UNIQUE', label: 'Unique Farmland' },
  { value: 'NONPRIME', label: 'Non-Prime' },
];

interface SearchSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onParcelSelect: (parcelId: string) => void;
}

export function SearchSidebar({
  isOpen,
  onToggle,
  onParcelSelect,
}: SearchSidebarProps) {
  // Filter state
  const [showFilters, setShowFilters] = useState(true);
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 100]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000000]);
  const [selectedZoning, setSelectedZoning] = useState<string[]>([]);
  const [selectedSoilTypes, setSelectedSoilTypes] = useState<string[]>([]);
  const [selectedCropland, setSelectedCropland] = useState<string[]>([]);
  const [hasWaterAccess, setHasWaterAccess] = useState<boolean | undefined>(
    undefined
  );
  const [hasRoadAccess, setHasRoadAccess] = useState<boolean | undefined>(
    undefined
  );
  const [city, setCity] = useState('');

  const { bounds, selectedParcelId, setSelectedParcelId } = useMapStore();

  // Build search params
  const searchParams: ParcelSearchParams = {
    minAreaAcres: areaRange[0],
    maxAreaAcres: areaRange[1],
    minPrice: priceRange[0],
    maxPrice: priceRange[1],
    zoningCodes: selectedZoning.length > 0 ? selectedZoning : undefined,
    soilTypes: selectedSoilTypes.length > 0 ? selectedSoilTypes : undefined,
    croplandClasses: selectedCropland.length > 0 ? selectedCropland : undefined,
    hasWaterAccess,
    hasRoadAccess,
    city: city || undefined,
    limit: 50,
  };

  // Query
  const { data: searchResults, isLoading, refetch } = useParcelSearch(searchParams);

  // Handle parcel click
  const handleParcelClick = useCallback(
    (parcel: ParcelListItem) => {
      setSelectedParcelId(parcel.id);
      onParcelSelect(parcel.id);
    },
    [setSelectedParcelId, onParcelSelect]
  );

  // Toggle zoning selection
  const toggleZoning = (value: string) => {
    setSelectedZoning((prev) =>
      prev.includes(value) ? prev.filter((z) => z !== value) : [...prev, value]
    );
  };

  // Toggle soil type selection
  const toggleSoilType = (value: string) => {
    setSelectedSoilTypes((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setAreaRange([0, 100]);
    setPriceRange([0, 50000000]);
    setSelectedZoning([]);
    setSelectedSoilTypes([]);
    setSelectedCropland([]);
    setHasWaterAccess(undefined);
    setHasRoadAccess(undefined);
    setCity('');
  };

  // Format price for display
  const formatPrice = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toLocaleString('en-US')}`;
  };

  // Count active filters
  const activeFilterCount =
    (areaRange[0] > 0 || areaRange[1] < 100 ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < 50000000 ? 1 : 0) +
    selectedZoning.length +
    selectedSoilTypes.length +
    selectedCropland.length +
    (hasWaterAccess !== undefined ? 1 : 0) +
    (hasRoadAccess !== undefined ? 1 : 0) +
    (city ? 1 : 0);

  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        className="absolute left-4 top-20 z-20 bg-background shadow-lg rounded-lg p-3 hover:bg-accent transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>
    );
  }

  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 bg-background border-r shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">Search Parcels</h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onToggle}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Filters Section */}
      <div className="border-b">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showFilters && (
          <div className="p-4 pt-0 space-y-4">
            {/* City Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                City
              </Label>
              <Input
                placeholder="Search by city..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            {/* Area Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Ruler className="h-4 w-4" />
                Area (acres): {areaRange[0]} - {areaRange[1]}
              </Label>
              <Slider
                value={areaRange}
                onValueChange={(value) =>
                  setAreaRange(value as [number, number])
                }
                min={0}
                max={100}
                step={1}
              />
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </Label>
              <Slider
                value={priceRange}
                onValueChange={(value) =>
                  setPriceRange(value as [number, number])
                }
                min={0}
                max={50000000}
                step={100000}
              />
            </div>

            {/* Zoning */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Zoning
              </Label>
              <div className="flex flex-wrap gap-1">
                {ZONING_OPTIONS.map((zone) => (
                  <Badge
                    key={zone.value}
                    variant={
                      selectedZoning.includes(zone.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleZoning(zone.value)}
                  >
                    {zone.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Soil Type */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Leaf className="h-4 w-4" />
                Soil Type
              </Label>
              <div className="flex flex-wrap gap-1">
                {SOIL_TYPE_OPTIONS.map((soil) => (
                  <Badge
                    key={soil.value}
                    variant={
                      selectedSoilTypes.includes(soil.value)
                        ? 'default'
                        : 'outline'
                    }
                    className="cursor-pointer"
                    onClick={() => toggleSoilType(soil.value)}
                  >
                    {soil.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Access Options */}
            <div className="space-y-2">
              <Label>Access</Label>
              <div className="flex gap-2">
                <Badge
                  variant={hasWaterAccess === true ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    setHasWaterAccess(
                      hasWaterAccess === true ? undefined : true
                    )
                  }
                >
                  💧 Water
                </Badge>
                <Badge
                  variant={hasRoadAccess === true ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() =>
                    setHasRoadAccess(hasRoadAccess === true ? undefined : true)
                  }
                >
                  🛣️ Road
                </Badge>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex-1"
              >
                Clear All
              </Button>
              <Button size="sm" onClick={() => refetch()} className="flex-1">
                Apply Filters
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Section */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {isLoading
                ? 'Searching...'
                : `${searchResults?.total ?? 0} parcels found`}
            </span>
            {isLoading && <Spinner size="sm" />}
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {searchResults?.parcels.map((parcel) => (
              <Card
                key={parcel.id}
                className={`cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedParcelId === parcel.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleParcelClick(parcel)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">{parcel.parcelId}</h4>
                      {parcel.address && (
                        <p className="text-xs text-muted-foreground">
                          {parcel.address}
                        </p>
                      )}
                      {parcel.city && (
                        <p className="text-xs text-muted-foreground">
                          {parcel.city}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-primary">
                        {parcel.areaAcres.toFixed(2)} ac
                      </p>
                      {parcel.estimatedPrice && (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(parcel.estimatedPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                  {parcel.zoningCode && (
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {parcel.zoningCode}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}

            {!isLoading && searchResults?.parcels.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No parcels match your filters</p>
                <p className="text-sm">Try adjusting your search criteria</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default SearchSidebar;
