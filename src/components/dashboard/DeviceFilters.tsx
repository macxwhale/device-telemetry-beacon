
import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DeviceStatus } from '@/types/telemetry';
import { DeviceSearchInput } from './filters/DeviceSearchInput';
import { DeviceStatusFilter } from './filters/DeviceStatusFilter';
import { DeviceBatteryFilter } from './filters/DeviceBatteryFilter';
import { DeviceManufacturerFilter } from './filters/DeviceManufacturerFilter';
import { DeviceSortControls } from './filters/DeviceSortControls';
import { FilterSummary } from './filters/FilterSummary';
import { useDeviceFilters } from '@/hooks/useDeviceFilters';

interface DeviceFiltersProps {
  devices: DeviceStatus[];
}

export const DeviceFilters = memo(({ devices }: DeviceFiltersProps) => {
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    batteryFilter,
    setBatteryFilter,
    manufacturerFilter,
    setManufacturerFilter,
    sortBy,
    setSortBy,
    sortOrder,
    handleSortToggle,
    manufacturers,
    filteredDevices,
    activeFiltersCount,
    clearFilters
  } = useDeviceFilters(devices);

  return (
    <Card className="mb-6">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <DeviceSearchInput
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <DeviceStatusFilter
            value={statusFilter}
            onChange={setStatusFilter}
          />

          <DeviceBatteryFilter
            value={batteryFilter}
            onChange={setBatteryFilter}
          />

          <DeviceManufacturerFilter
            manufacturers={manufacturers}
            value={manufacturerFilter}
            onChange={setManufacturerFilter}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <DeviceSortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortByChange={setSortBy}
            onSortOrderToggle={handleSortToggle}
          />

          <FilterSummary
            totalDevices={devices.length}
            filteredDevices={filteredDevices.length}
            activeFiltersCount={activeFiltersCount}
            onClearFilters={clearFilters}
          />
        </div>
      </CardContent>
    </Card>
  );
});

DeviceFilters.displayName = 'DeviceFilters';
