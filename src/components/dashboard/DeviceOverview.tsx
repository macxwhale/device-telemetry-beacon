
import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatus } from "@/types/telemetry";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";

interface DeviceOverviewProps {
  devices: DeviceStatus[];
}

export const DeviceOverview: FC<DeviceOverviewProps> = ({ devices }) => {
  // Status summary
  const onlineCount = devices.filter(device => device.isOnline).length;
  const offlineCount = devices.length - onlineCount;
  
  const statusData = [
    { name: "Online", value: onlineCount },
    { name: "Offline", value: offlineCount }
  ];
  
  const COLORS = ["#10b981", "#ef4444"];
  
  // Device types summary
  const deviceTypes = devices.reduce((acc, device) => {
    const manufacturer = device.manufacturer;
    acc[manufacturer] = (acc[manufacturer] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const deviceTypeData = Object.entries(deviceTypes).map(([name, value]) => ({
    name,
    value
  }));
  
  const TYPE_COLORS = ["#3b82f6", "#8b5cf6", "#f59e0b", "#ec4899", "#6b7280"];
  
  return (
    <Card className="col-span-full lg:col-span-2">
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
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
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {deviceTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={TYPE_COLORS[index % TYPE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
