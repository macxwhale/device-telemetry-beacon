import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DeviceStatus } from '@/types/telemetry';

interface FilterState {
  searchTerm: string;
  statusFilter: 'all' | 'online' | 'offline';
  batteryFilter: 'all' | 'low' | 'normal';
  manufacturerFilter: string;
  sortBy: 'name' | 'lastSeen' | 'battery';
  sortOrder: 'asc' | 'desc';
}

interface FilterContextType {
  filters: FilterState;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: FilterState['statusFilter']) => void;
  setBatteryFilter: (battery: FilterState['batteryFilter']) => void;
  setManufacturerFilter: (manufacturer: string) => void;
  setSortBy: (sortBy: FilterState['sortBy']) => void;
  setSortOrder: (order: FilterState['sortOrder']) => void;
  clearFilters: () => void;
  filteredDevices: DeviceStatus[];
  setDevices: (devices: DeviceStatus[]) => void;
}

export const FilterContext = createContext<FilterContextType | undefined>(undefined);

const initialFilters: FilterState = {
  searchTerm: '',
  statusFilter: 'all',
  batteryFilter: 'all',
  manufacturerFilter: 'all',
  sortBy: 'name',
  sortOrder: 'asc'
};

export const FilterProvider = ({ children }: { children: ReactNode }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [devices, setDevices] = useState<DeviceStatus[]>([]);

  const setSearchTerm = (term: string) => {
    setFilters(prev => ({ ...prev, searchTerm: term }));
  };

  const setStatusFilter = (status: FilterState['statusFilter']) => {
    setFilters(prev => ({ ...prev, statusFilter: status }));
  };

  const setBatteryFilter = (battery: FilterState['batteryFilter']) => {
    setFilters(prev => ({ ...prev, batteryFilter: battery }));
  };

  const setManufacturerFilter = (manufacturer: string) => {
    setFilters(prev => ({ ...prev, manufacturerFilter: manufacturer }));
  };

  const setSortBy = (sortBy: FilterState['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const setSortOrder = (order: FilterState['sortOrder']) => {
    setFilters(prev => ({ ...prev, sortOrder: order }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
  };

  const filteredDevices = React.useMemo(() => {
    let filtered = [...devices];

    // Search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(term) ||
        device.model.toLowerCase().includes(term) ||
        device.manufacturer.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (filters.statusFilter !== 'all') {
      filtered = filtered.filter(device =>
        filters.statusFilter === 'online' ? device.isOnline : !device.isOnline
      );
    }

    // Battery filter
    if (filters.batteryFilter !== 'all') {
      filtered = filtered.filter(device =>
        filters.batteryFilter === 'low' ? device.battery_level < 20 : device.battery_level >= 20
      );
    }

    // Manufacturer filter
    if (filters.manufacturerFilter !== 'all') {
      filtered = filtered.filter(device =>
        device.manufacturer === filters.manufacturerFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (filters.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'lastSeen':
          aVal = new Date(a.last_seen).getTime();
          bVal = new Date(b.last_seen).getTime();
          break;
        case 'battery':
          aVal = a.battery_level;
          bVal = b.battery_level;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return filters.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return filters.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [devices, filters]);

  return (
    <FilterContext.Provider value={{
      filters,
      setSearchTerm,
      setStatusFilter,
      setBatteryFilter,
      setManufacturerFilter,
      setSortBy,
      setSortOrder,
      clearFilters,
      filteredDevices,
      setDevices
    }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilter = () => {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
};
