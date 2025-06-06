
import { useMemo } from 'react';
import { DeviceStatus } from '@/types/telemetry';

interface UseDeviceStatusProps {
  devices: DeviceStatus[];
  statusFilter: 'all' | 'online' | 'offline';
  searchQuery: string;
}

export const useDeviceStatus = ({ devices, statusFilter, searchQuery }: UseDeviceStatusProps) => {
  const filteredDevices = useMemo(() => {
    return devices.filter((device: DeviceStatus) => {
      const matchesSearch = device.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           device.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           device.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || 
                           (statusFilter === "online" && device.isOnline) ||
                           (statusFilter === "offline" && !device.isOnline);
      
      return matchesSearch && matchesStatus;
    });
  }, [devices, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    const onlineCount = devices.filter(device => device.isOnline).length;
    const offlineCount = devices.length - onlineCount;
    const lowBatteryCount = devices.filter(device => device.battery_level < 20).length;
    
    return {
      total: devices.length,
      online: onlineCount,
      offline: offlineCount,
      lowBattery: lowBatteryCount,
      issues: offlineCount + lowBatteryCount
    };
  }, [devices]);

  return {
    filteredDevices,
    stats
  };
};
