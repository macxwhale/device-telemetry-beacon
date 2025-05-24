
import { FC, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DeviceStatus } from '@/types/telemetry';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Shield, 
  Smartphone,
  Battery,
  Wifi,
  Activity
} from 'lucide-react';

interface DeviceAnalyticsProps {
  devices: DeviceStatus[];
}

interface AnalyticsData {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  lowBatteryDevices: number;
  securityIssues: number;
  manufacturerDistribution: { [key: string]: number };
  osVersionDistribution: { [key: string]: number };
  averageBattery: number;
  uptimeStats: {
    excellent: number; // > 95%
    good: number; // 80-95%
    poor: number; // < 80%
  };
}

export const DeviceAnalytics: FC<DeviceAnalyticsProps> = memo(({ devices }) => {
  const analytics = useMemo((): AnalyticsData => {
    const totalDevices = devices.length;
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const offlineDevices = totalDevices - onlineDevices;
    const lowBatteryDevices = devices.filter(d => d.battery_level < 20).length;
    const securityIssues = devices.filter(d => 
      d.telemetry?.security_info?.is_rooted || 
      d.telemetry?.device_info?.is_emulator
    ).length;

    // Manufacturer distribution
    const manufacturerDistribution: { [key: string]: number } = {};
    devices.forEach(device => {
      const manufacturer = device.manufacturer || 'Unknown';
      manufacturerDistribution[manufacturer] = (manufacturerDistribution[manufacturer] || 0) + 1;
    });

    // OS Version distribution
    const osVersionDistribution: { [key: string]: number } = {};
    devices.forEach(device => {
      const version = device.os_version || 'Unknown';
      osVersionDistribution[version] = (osVersionDistribution[version] || 0) + 1;
    });

    // Average battery
    const averageBattery = totalDevices > 0 
      ? devices.reduce((sum, d) => sum + d.battery_level, 0) / totalDevices 
      : 0;

    // Uptime stats (mock calculation based on online status and battery)
    const uptimeStats = {
      excellent: devices.filter(d => d.isOnline && d.battery_level > 50).length,
      good: devices.filter(d => d.isOnline && d.battery_level >= 20 && d.battery_level <= 50).length,
      poor: devices.filter(d => !d.isOnline || d.battery_level < 20).length,
    };

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      lowBatteryDevices,
      securityIssues,
      manufacturerDistribution,
      osVersionDistribution,
      averageBattery,
      uptimeStats,
    };
  }, [devices]);

  const topManufacturers = useMemo(() => {
    return Object.entries(analytics.manufacturerDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }, [analytics.manufacturerDistribution]);

  const topOSVersions = useMemo(() => {
    return Object.entries(analytics.osVersionDistribution)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  }, [analytics.osVersionDistribution]);

  const getHealthScore = () => {
    if (analytics.totalDevices === 0) return 0;
    const onlineScore = (analytics.onlineDevices / analytics.totalDevices) * 40;
    const batteryScore = (analytics.averageBattery / 100) * 30;
    const securityScore = ((analytics.totalDevices - analytics.securityIssues) / analytics.totalDevices) * 30;
    return Math.round(onlineScore + batteryScore + securityScore);
  };

  const healthScore = getHealthScore();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {/* Fleet Health Score */}
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Fleet Health Score
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">{healthScore}%</div>
            <Progress value={healthScore} className="h-3" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-green-600">{analytics.onlineDevices}</div>
              <div className="text-muted-foreground">Online</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-red-600">{analytics.offlineDevices}</div>
              <div className="text-muted-foreground">Offline</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Critical Alerts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Battery className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Low Battery</span>
            </div>
            <Badge variant={analytics.lowBatteryDevices > 0 ? "destructive" : "secondary"}>
              {analytics.lowBatteryDevices}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="h-4 w-4 text-red-500" />
              <span className="text-sm">Offline</span>
            </div>
            <Badge variant={analytics.offlineDevices > 0 ? "destructive" : "secondary"}>
              {analytics.offlineDevices}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="text-sm">Security Issues</span>
            </div>
            <Badge variant={analytics.securityIssues > 0 ? "destructive" : "secondary"}>
              {analytics.securityIssues}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Device Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Top Manufacturers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topManufacturers.map(([manufacturer, count]) => (
            <div key={manufacturer} className="flex items-center justify-between">
              <span className="text-sm font-medium">{manufacturer}</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(count / analytics.totalDevices) * 100} 
                  className="w-16 h-2" 
                />
                <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* OS Versions */}
      <Card className="lg:col-span-2 xl:col-span-1">
        <CardHeader>
          <CardTitle>OS Version Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topOSVersions.map(([version, count]) => (
            <div key={version} className="flex items-center justify-between">
              <span className="text-sm font-medium">Android {version}</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={(count / analytics.totalDevices) * 100} 
                  className="w-20 h-2" 
                />
                <span className="text-sm text-muted-foreground w-8 text-right">{count}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Uptime Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Device Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Excellent</span>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="bg-green-500">
                {analytics.uptimeStats.excellent}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Good</span>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-500">
                {analytics.uptimeStats.good}
              </Badge>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Poor</span>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">
                {analytics.uptimeStats.poor}
              </Badge>
            </div>
          </div>
          
          <div className="pt-2 border-t">
            <div className="text-center">
              <div className="text-lg font-semibold">{analytics.averageBattery.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">Avg Battery</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

DeviceAnalytics.displayName = 'DeviceAnalytics';
