import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Battery, 
  Shield, 
  RefreshCw,
  Zap,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useDevicesQuery } from '@/hooks/useDevicesQuery';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { useRecordAnalyticsMetric } from '@/hooks/useAdvancedAnalytics';
import { DeviceStatus } from '@/types/telemetry';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

export const RealTimeAnalyticsDashboard = () => {
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [metricsHistory, setMetricsHistory] = useState<Array<{
    timestamp: string;
    onlineDevices: number;
    avgBattery: number;
    securityAlerts: number;
  }>>([]);

  const { data: devices = [], isLoading } = useDevicesQuery();
  const { refresh } = useRealTimeUpdates({ enabled: isRealTimeEnabled });
  const recordMetric = useRecordAnalyticsMetric();

  // Calculate real-time metrics
  const realTimeMetrics = React.useMemo(() => {
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const totalDevices = devices.length;
    const avgBattery = devices.length > 0 
      ? devices.reduce((sum, d) => sum + d.battery_level, 0) / devices.length 
      : 0;
    
    const lowBatteryDevices = devices.filter(d => d.battery_level < 20).length;
    const securityAlerts = devices.filter(d => 
      d.telemetry?.security_info?.is_rooted || 
      d.telemetry?.device_info?.is_emulator
    ).length;

    const criticalDevices = devices.filter(d => 
      !d.isOnline || d.battery_level < 10 || 
      d.telemetry?.security_info?.is_rooted
    ).length;

    return {
      onlineDevices,
      totalDevices,
      avgBattery,
      lowBatteryDevices,
      securityAlerts,
      criticalDevices,
      uptimePercentage: totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0
    };
  }, [devices]);

  // Update metrics history for charting
  useEffect(() => {
    if (devices.length > 0) {
      const timestamp = new Date().toLocaleTimeString();
      setMetricsHistory(prev => {
        const newMetrics = {
          timestamp,
          onlineDevices: realTimeMetrics.onlineDevices,
          avgBattery: realTimeMetrics.avgBattery,
          securityAlerts: realTimeMetrics.securityAlerts
        };
        
        // Keep only last 20 data points
        const updated = [...prev, newMetrics].slice(-20);
        return updated;
      });

      // Record analytics metrics
      if (isRealTimeEnabled) {
        recordMetric.mutate({
          deviceId: 'fleet',
          metricType: 'fleet_uptime',
          metricValue: realTimeMetrics.uptimePercentage,
          metadata: {
            totalDevices: realTimeMetrics.totalDevices,
            onlineDevices: realTimeMetrics.onlineDevices,
            timestamp: new Date().toISOString()
          }
        });
      }
    }
  }, [devices, realTimeMetrics, isRealTimeEnabled, recordMetric]);

  const handleRefresh = () => {
    refresh();
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-gray-200 animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Real-Time Analytics</span>
              </CardTitle>
              <CardDescription>
                Live monitoring and insights for your device fleet
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isRealTimeEnabled}
                  onCheckedChange={setIsRealTimeEnabled}
                />
                <span className="text-sm">Real-time updates</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Real-time Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fleet Status</CardTitle>
            <div className="flex items-center space-x-1">
              {isRealTimeEnabled && (
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              )}
              <Wifi className={`h-4 w-4 ${realTimeMetrics.onlineDevices > 0 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {realTimeMetrics.onlineDevices}/{realTimeMetrics.totalDevices}
            </div>
            <p className="text-xs text-muted-foreground">
              {realTimeMetrics.uptimePercentage.toFixed(1)}% uptime
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant={realTimeMetrics.uptimePercentage > 90 ? "default" : "destructive"}>
                {realTimeMetrics.uptimePercentage > 90 ? "Healthy" : "Attention Needed"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Battery Health</CardTitle>
            <Battery className={`h-4 w-4 ${realTimeMetrics.avgBattery > 50 ? 'text-green-500' : 'text-orange-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics.avgBattery.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">
              {realTimeMetrics.lowBatteryDevices} devices below 20%
            </p>
            {realTimeMetrics.lowBatteryDevices > 0 && (
              <Badge variant="destructive" className="mt-2">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Low Battery Alert
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Status</CardTitle>
            <Shield className={`h-4 w-4 ${realTimeMetrics.securityAlerts === 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics.securityAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Active security alerts
            </p>
            <Badge variant={realTimeMetrics.securityAlerts === 0 ? "default" : "destructive"} className="mt-2">
              {realTimeMetrics.securityAlerts === 0 ? "Secure" : "Threats Detected"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <TrendingUp className={`h-4 w-4 ${realTimeMetrics.criticalDevices === 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeMetrics.criticalDevices}</div>
            <p className="text-xs text-muted-foreground">
              Devices requiring attention
            </p>
            {realTimeMetrics.criticalDevices > 0 && (
              <Badge variant="destructive" className="mt-2">
                <Zap className="h-3 w-3 mr-1" />
                Action Required
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Fleet Uptime Trend</CardTitle>
            <CardDescription>Real-time fleet availability over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metricsHistory}>
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, realTimeMetrics.totalDevices]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="onlineDevices" 
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Battery Level Trend</CardTitle>
            <CardDescription>Average fleet battery level over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={metricsHistory}>
                <XAxis dataKey="timestamp" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgBattery" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Live Device Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Live Device Events</CardTitle>
          <CardDescription>Recent device status changes and events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {devices.slice(0, 10).map((device) => (
              <div key={device.id} className="flex items-center justify-between p-2 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${device.isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <p className="text-sm font-medium">{device.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {device.manufacturer} {device.model}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={device.isOnline ? "default" : "secondary"}>
                    {device.isOnline ? "Online" : "Offline"}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {device.battery_level}%
                  </span>
                </div>
              </div>
            ))}
            {devices.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                No devices available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
