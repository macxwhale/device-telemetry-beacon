
import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeviceHistory } from "@/types/telemetry";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { format } from "date-fns";

interface DeviceChartsProps {
  history: DeviceHistory[];
}

export const DeviceCharts: FC<DeviceChartsProps> = ({ history }) => {
  // Process history data for charts
  const batteryData = history.map(item => ({
    time: format(new Date(item.timestamp), 'HH:mm'),
    value: item.telemetry.battery_info.battery_level,
    timestamp: item.timestamp
  })).reverse();
  
  // Calculate uptime in hours from milliseconds
  const uptimeData = history.map(item => ({
    time: format(new Date(item.timestamp), 'HH:mm'),
    value: Math.floor(item.telemetry.system_info.uptime_millis / (1000 * 60 * 60)),
    timestamp: item.timestamp
  })).reverse();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
      {/* Battery Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Battery Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={batteryData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  domain={[0, 100]}
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, "Battery Level"]}
                  labelFormatter={(time) => `Time: ${time}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      {/* Uptime Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Device Uptime</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={uptimeData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 25,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `${value}h`}
                />
                <Tooltip
                  formatter={(value: number) => [`${value} hours`, "Uptime"]}
                  labelFormatter={(time) => `Time: ${time}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#10b981"
                  activeDot={{ r: 8 }}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
