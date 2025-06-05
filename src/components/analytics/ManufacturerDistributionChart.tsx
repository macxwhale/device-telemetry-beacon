
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { DeviceStatus } from '@/types/telemetry';

interface ManufacturerDistributionChartProps {
  devices: DeviceStatus[];
}

export const ManufacturerDistributionChart = ({ devices }: ManufacturerDistributionChartProps) => {
  const manufacturerDistribution = React.useMemo(() => {
    return devices.reduce((acc, device) => {
      const manufacturer = device.manufacturer || 'Unknown';
      acc[manufacturer] = (acc[manufacturer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [devices]);

  const manufacturerChartData = Object.entries(manufacturerDistribution).map(([name, value]) => ({
    name,
    value,
    percentage: devices.length > 0 ? (value / devices.length) * 100 : 0
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manufacturer Distribution</CardTitle>
        <CardDescription>Device breakdown by manufacturer</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPieChart>
            <Pie
              data={manufacturerChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name} (${percentage.toFixed(1)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {manufacturerChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </RechartsPieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
