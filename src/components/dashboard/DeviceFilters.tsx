
import { memo, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, ArrowUpDown } from 'lucide-react';
import { useFilter } from '@/contexts/FilterContext';
import { DeviceStatus } from '@/types/telemetry';

interface DeviceFiltersProps {
  devices: DeviceStatus[];
}

export const DeviceFilters = memo(({ devices }: DeviceFiltersProps) => {
  const {
    filters,
    setSearchTerm,
    setStatusFilter,
    setBatteryFilter,
    setManufacturerFilter,
    setSortBy,
    setSortOrder,
    clearFilters,
    filteredDevices
  } = useFilter();

  const manufacturers = useMemo(() => {
    const unique = [...new Set(devices.map(d => d.manufacturer))];
    return unique.sort();
  }, [devices]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.statusFilter !== 'all') count++;
    if (filters.batteryFilter !== 'all') count++;
    if (filters.manufacturerFilter !== 'all') count++;
    return count;
  }, [filters]);

  const handleSortToggle = () => {
    setSortOrder(filters.sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-8"
              value={filters.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <Select value={filters.statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          {/* Battery Filter */}
          <Select value={filters.batteryFilter} onValueChange={setBatteryFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Battery</SelectItem>
              <SelectItem value="low">Low Battery</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>

          {/* Manufacturer Filter */}
          <Select value={filters.manufacturerFilter} onValueChange={setManufacturerFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Manufacturer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {manufacturers.map(manufacturer => (
                <SelectItem key={manufacturer} value={manufacturer}>
                  {manufacturer}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select value={filters.sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="lastSeen">Last Seen</SelectItem>
                <SelectItem value="battery">Battery</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortToggle}
              className="px-2"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Filter Info and Clear */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {filteredDevices.length} of {devices.length} devices
              </span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {activeFiltersCount}
                </Badge>
              )}
            </div>
            
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

DeviceFilters.displayName = 'DeviceFilters';
