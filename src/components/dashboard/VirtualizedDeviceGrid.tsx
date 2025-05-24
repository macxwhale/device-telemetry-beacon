
import { useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { DeviceStatus } from '@/types/telemetry';
import { DeviceStatusCard } from './DeviceStatusCard';

interface VirtualizedDeviceGridProps {
  devices: DeviceStatus[];
  selectedDevices?: string[];
  onSelectionChange?: (deviceIds: string[]) => void;
}

export const VirtualizedDeviceGrid = ({ 
  devices, 
  selectedDevices = [],
  onSelectionChange 
}: VirtualizedDeviceGridProps) => {
  const parentRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);

  // Calculate how many items per row based on screen size
  const getItemsPerRow = () => {
    if (typeof window === 'undefined') return 4;
    const width = window.innerWidth;
    if (width < 640) return 1; // sm
    if (width < 768) return 2; // md
    if (width < 1024) return 3; // lg
    return 4; // xl and above
  };

  const itemsPerRow = getItemsPerRow();
  const rowCount = Math.ceil(devices.length / itemsPerRow);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220, // Slightly increased for selection checkbox
    overscan: 2,
  });

  const handleDeviceSelection = (deviceId: string, selected: boolean) => {
    if (!onSelectionChange) return;
    
    if (selected) {
      onSelectionChange([...selectedDevices, deviceId]);
    } else {
      onSelectionChange(selectedDevices.filter(id => id !== deviceId));
    }
  };

  if (devices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No devices found</p>
      </div>
    );
  }

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * itemsPerRow;
          const endIndex = Math.min(startIndex + itemsPerRow, devices.length);
          const rowDevices = devices.slice(startIndex, endIndex);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-2">
                {rowDevices.map((device) => (
                  <DeviceStatusCard 
                    key={device.id} 
                    device={device}
                    isSelected={selectedDevices.includes(device.id)}
                    onSelectionChange={onSelectionChange ? 
                      (selected) => handleDeviceSelection(device.id, selected) : 
                      undefined
                    }
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
