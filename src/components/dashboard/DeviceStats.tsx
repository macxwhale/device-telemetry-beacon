
import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceStatus } from "@/types/telemetry";
import { AlertTriangle, Battery, CheckCircle, Smartphone, XCircle } from "lucide-react";

interface DeviceStatsProps {
  devices: DeviceStatus[];
}

export const DeviceStats: FC<DeviceStatsProps> = ({ devices }) => {
  const onlineCount = devices.filter(device => device.isOnline).length;
  const offlineCount = devices.length - onlineCount;
  const lowBatteryCount = devices.filter(device => device.battery_level < 20).length;
  
  const stats = [
    {
      name: "Total Devices",
      value: devices.length,
      icon: Smartphone,
      color: "text-blue-500"
    },
    {
      name: "Online",
      value: onlineCount,
      icon: CheckCircle,
      color: "text-green-500"
    },
    {
      name: "Offline",
      value: offlineCount,
      icon: XCircle,
      color: "text-red-500"
    },
    {
      name: "Low Battery",
      value: lowBatteryCount,
      icon: Battery,
      color: "text-yellow-500"
    },
    {
      name: "Issues",
      value: offlineCount + lowBatteryCount,
      icon: AlertTriangle,
      color: "text-orange-500"
    },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {stats.map((stat) => (
        <Card key={stat.name}>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{stat.value}</span>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
