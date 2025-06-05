
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, Shield, Battery, TrendingUp } from 'lucide-react';
import { DeviceStatus } from '@/types/telemetry';

interface FleetOverviewCardsProps {
  devices: DeviceStatus[];
  selectedDeviceId?: string;
  healthScore?: number;
}

export const FleetOverviewCards = ({ devices, selectedDeviceId, healthScore = 0 }: FleetOverviewCardsProps) => {
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

    return {
      availability: totalDevices > 0 ? (onlineDevices / totalDevices) * 100 : 0,
      avgBattery,
      securityRisks,
      totalDevices,
      onlineDevices
    };
  }, [devices]);

  return (
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
  );
};
