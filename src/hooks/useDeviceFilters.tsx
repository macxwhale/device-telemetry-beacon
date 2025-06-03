
import { useMemo, useState } from 'react';
import { DeviceStatus } from '@/types/telemetry';

export const useDeviceFilters = (devices: DeviceStatus[]) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [batteryFilter, setBatteryFilter] = useState<'all' | 'low' | 'normal'>('all');
  const [manufacturerFilter, setManufacturerFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'lastSeen' | 'battery'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const manufacturers = useMemo(() => {
    const unique = [...new Set(devices.map(d => d.manufacturer))];
    return unique.sort();
  }, [devices]);

  const filteredDevices = useMemo(() => {
    let filtered = [...devices];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(device =>
        device.name.toLowerCase().includes(term) ||
        device.model.toLowerCase().includes(term) ||
        device.manufacturer.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(device =>
        statusFilter === 'online' ? device.isOnline : !device.isOnline
      );
    }

    // Battery filter
    if (batteryFilter !== 'all') {
      filtered = filtered.filter(device =>
        batteryFilter === 'low' ? device.battery_level < 20 : device.battery_level >= 20
      );
    }

    // Manufacturer filter
    if (manufacturerFilter !== 'all') {
      filtered = filtered.filter(device =>
        device.manufacturer === manufacturerFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
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

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [devices, searchTerm, statusFilter, batteryFilter, manufacturerFilter, sortBy, sortOrder]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (statusFilter !== 'all') count++;
    if (batteryFilter !== 'all') count++;
    if (manufacturerFilter !== 'all') count++;
    return count;
  }, [searchTerm, statusFilter, batteryFilter, manufacturerFilter]);

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setBatteryFilter('all');
    setManufacturerFilter('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  return {
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
  };
};
