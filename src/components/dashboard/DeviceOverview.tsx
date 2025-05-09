
import { FC, memo, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatus } from "@/types/telemetry";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface DeviceOverviewProps {
  devices: DeviceStatus[];
}

export const DeviceOverview: FC<DeviceOverviewProps> = memo(({ devices }) => {
  // Memoize the chart data to prevent unnecessary recalculations
  const { statusData, deviceTypeData } = useMemo(() => {
    // Status summary
    const onlineCount = devices.filter(device => device.isOnline).length;
    const offlineCount = devices.length - onlineCount;
    
    const statusData = [
      { name: "Online", value: onlineCount },
      { name: "Offline", value: offlineCount }
    ];
    
    // Device types summary
    const deviceTypes = devices.reduce((acc, device) => {
      const manufacturer = device.manufacturer;
      acc[manufacturer] = (acc[manufacturer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const deviceTypeData = Object.entries(deviceTypes)
      .map(([name, value]) => ({
        name,
        value
      }))
      // Sort by value for consistent rendering
      .sort((a, b) => b.value - a.value);
    
    return { statusData, deviceTypeData };
  }, [devices]);
  
  const COLORS = ["#10b981", "#ef4444"];
  const TYPE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#6b7280"];
  
  // Custom label formatter to prevent excessive re-renders
  const renderCustomLabel = ({ name, percent }: { name: string, percent: number }) => {
    return `${name} ${(percent * 100).toFixed(0)}%`;
  };

  return (
    <Card className="col-span-full lg:col-span-2 chart-container">
      <CardHeader>
        <CardTitle>Device Overview</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-4">
        <div className="w-full sm:w-1/2 h-[250px]">
          <p className="text-center text-sm font-medium mb-2">Status</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={renderCustomLabel}
                animationDuration={500}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`status-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="w-full sm:w-1/2 h-[250px]">
          <p className="text-center text-sm font-medium mb-2">Device Types</p>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deviceTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={renderCustomLabel}
                animationDuration={500}
              >
                {deviceTypeData.map((entry, index) => (
                  <Cell key={`type-cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Enhanced memoization for device changes
  if (prevProps.devices.length !== nextProps.devices.length) {
    return false;
  }
  
  // Check if the online status of any device has changed
  const prevOnlineCount = prevProps.devices.filter(d => d.isOnline).length;
  const nextOnlineCount = nextProps.devices.filter(d => d.isOnline).length;
  
  if (prevOnlineCount !== nextOnlineCount) {
    return false;
  }
  
  // Check if any manufacturer counts have changed
  const prevManufacturerCount = new Map();
  const nextManufacturerCount = new Map();
  
  prevProps.devices.forEach(device => {
    prevManufacturerCount.set(
      device.manufacturer, 
      (prevManufacturerCount.get(device.manufacturer) || 0) + 1
    );
  });
  
  nextProps.devices.forEach(device => {
    nextManufacturerCount.set(
      device.manufacturer, 
      (nextManufacturerCount.get(device.manufacturer) || 0) + 1
    );
  });
  
  // Compare manufacturer counts
  if (prevManufacturerCount.size !== nextManufacturerCount.size) {
    return false;
  }
  
  for (const [key, count] of prevManufacturerCount.entries()) {
    if (nextManufacturerCount.get(key) !== count) {
      return false;
    }
  }
  
  return true;
});

DeviceOverview.displayName = "DeviceOverview";
