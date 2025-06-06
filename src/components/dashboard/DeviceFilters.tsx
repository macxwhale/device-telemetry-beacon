
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { DeviceSearchInput } from "./filters/DeviceSearchInput";
import { DeviceStatusFilter } from "./filters/DeviceStatusFilter";
import { DeviceManufacturerFilter } from "./filters/DeviceManufacturerFilter";
import { DeviceBatteryFilter } from "./filters/DeviceBatteryFilter";
import { DeviceSortControls } from "./filters/DeviceSortControls";
import { FilterSummary } from "./filters/FilterSummary";
import { DeviceStatus } from "@/types/telemetry";

interface DeviceFiltersProps {
  devices: DeviceStatus[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: 'all' | 'online' | 'offline';
  onStatusFilterChange: (filter: 'all' | 'online' | 'offline') => void;
}

export const DeviceFilters = ({ 
  devices, 
  searchQuery, 
  onSearchChange, 
  statusFilter, 
  onStatusFilterChange 
}: DeviceFiltersProps) => {
  const [manufacturerFilter, setManufacturerFilter] = useState<string>("all");
  const [batteryFilter, setBatteryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const clearFilters = () => {
    onSearchChange("");
    onStatusFilterChange("all");
    setManufacturerFilter("all");
    setBatteryFilter("all");
    setSortBy("name");
    setSortOrder("asc");
  };

  const hasActiveFilters = 
    searchQuery !== "" || 
    statusFilter !== "all" || 
    manufacturerFilter !== "all" || 
    batteryFilter !== "all";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <DeviceSearchInput
              value={searchQuery}
              onChange={onSearchChange}
            />
            
            <DeviceStatusFilter
              value={statusFilter}
              onChange={onStatusFilterChange}
            />
            
            <DeviceManufacturerFilter
              devices={devices}
              value={manufacturerFilter}
              onChange={setManufacturerFilter}
            />
            
            <DeviceBatteryFilter
              value={batteryFilter}
              onChange={setBatteryFilter}
            />
            
            <DeviceSortControls
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSortByChange={setSortBy}
              onSortOrderChange={setSortOrder}
            />
          </div>
          
          {hasActiveFilters && (
            <FilterSummary
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              manufacturerFilter={manufacturerFilter}
              batteryFilter={batteryFilter}
              onClearFilters={clearFilters}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
