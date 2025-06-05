
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UsagePattern {
  hour_of_day: number;
  avg_battery_level: string;
  total_connections: number;
}

interface BatteryTrendChartProps {
  usagePatterns: UsagePattern[];
  selectedDeviceId?: string;
}

export const BatteryTrendChart = ({ usagePatterns, selectedDeviceId }: BatteryTrendChartProps) => {
  const batteryTrendData = usagePatterns.map(pattern => ({
    hour: `${pattern.hour_of_day}:00`,
    battery: parseFloat(pattern.avg_battery_level || '0'),
    connections: pattern.total_connections
  }));

  if (!selectedDeviceId || batteryTrendData.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            Select a device to view trend analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Battery Usage Pattern</CardTitle>
        <CardDescription>24-hour battery level trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={batteryTrendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Area 
              type="monotone" 
              dataKey="battery" 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
