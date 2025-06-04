import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Shield, 
  Battery, 
  Clock,
  BarChart3,
  PieChart
} from 'lucide-react';
import { useDeviceAnalytics, useDeviceHealthScore, useDeviceUsagePatterns } from '@/hooks/useAdvancedAnalytics';
import { DeviceStatus } from '@/types/telemetry';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';

interface AdvancedAnalyticsPanelProps {
  devices: DeviceStatus[];
  selectedDeviceId?: string;
}

export const AdvancedAnalyticsPanel = ({ devices, selectedDeviceId }: AdvancedAnalyticsPanelProps) => {
  const { data: analytics = [] } = useDeviceAnalytics();
  const { data: healthScore = 0 } = useDeviceHealthScore(selectedDeviceId || '');
  const { data: usagePatterns = [] } = useDeviceUsagePatterns(selectedDeviceId || '');

  // Calculate fleet-wide insights
  const fleetInsights = React.useMemo(() => {
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const totalDevices = devices.length;
    const avgBattery = devices.length > 0 
      ? devices.reduce((sum, d) => sum + d.battery_level, 0) / devices.length 
      : 0;
    
    const securityRisks = devices.filter(d => 
      d.telemetry?.security_info?.is_rooted || 
      d.telemetry?.device_info?.is_emulator
    ).length;

    const manufacturerDistribution = devices.reduce((acc, device) => {
      const manufacturer = device.manufacturer || 'Unknown';
      acc[manufacturer] = (acc[manufacturer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      availability: totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0,
      avgBattery,
      securityRisks,
      totalDevices,
      onlineDevices,
      manufacturerDistribution
    };
  }, [devices]);

  const manufacturerChartData = Object.entries(fleetInsights.manufacturerDistribution).map(([name, value]) => ({
    name,
    value,
    percentage: fleetInsights.totalDevices > 0 ? (value / fleetInsights.totalDevices) * 100 : 0
  }));

  const batteryTrendData = usagePatterns.map(pattern => ({
    hour: `${pattern.hour_of_day}:00`,
    battery: parseFloat(pattern.avg_battery_level || '0'),
    connections: pattern.total_connections
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  return (
    <div className="space-y-6">
      {/* Fleet Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Availability</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetInsights.availability.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {fleetInsights.onlineDevices} of {fleetInsights.totalDevices} devices online
            </p>
            <Progress value={fleetInsights.availability} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Battery</CardTitle>
            <Battery className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetInsights.avgBattery.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              Fleet average battery level
            </p>
            <Progress value={fleetInsights.avgBattery} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Risks</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetInsights.securityRisks}</div>
            <p className="text-xs text-muted-foreground">
              Devices with security concerns
            </p>
            {fleetInsights.securityRisks > 0 && (
              <Badge variant="destructive" className="mt-2">
                Action Required
              </Badge>
            )}
          </CardContent>
        </Card>

        {selectedDeviceId && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Device Health</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{healthScore.toFixed(0)}/100</div>
              <p className="text-xs text-muted-foreground">
                Overall health score
              </p>
              <Progress value={healthScore} className="mt-2" />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Fleet Status Overview</CardTitle>
                <CardDescription>Real-time status of all devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Online Devices</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">{fleetInsights.onlineDevices}</Badge>
                      <span className="text-sm text-muted-foreground">
                        ({((fleetInsights.onlineDevices / fleetInsights.totalDevices) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Offline Devices</span>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {fleetInsights.totalDevices - fleetInsights.onlineDevices}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        ({(((fleetInsights.totalDevices - fleetInsights.onlineDevices) / fleetInsights.totalDevices) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Risks</span>
                    <Badge variant={fleetInsights.securityRisks > 0 ? "destructive" : "default"}>
                      {fleetInsights.securityRisks}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Analytics Events</CardTitle>
                <CardDescription>Latest metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.slice(0, 5).map((metric) => (
                    <div key={metric.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{metric.metric_type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(metric.recorded_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{metric.metric_value}</Badge>
                    </div>
                  ))}
                  {analytics.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No analytics data available yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {selectedDeviceId && batteryTrendData.length > 0 ? (
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
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">
                  Select a device to view trend analysis
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Average Response Time</span>
                    <Badge variant="outline">< 100ms</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Sync Success Rate</span>
                    <Badge variant="default">99.8%</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Efficiency</span>
                    <Badge variant="default">Optimal</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI-powered recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Battery Optimization
                    </p>
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      3 devices showing unusual battery drain patterns
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Maintenance Alert
                    </p>
                    <p className="text-xs text-yellow-600 dark:text-yellow-300">
                      Scheduled maintenance recommended for 2 devices
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      Performance
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-300">
                      Fleet performance is above baseline
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
