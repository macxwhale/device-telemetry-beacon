
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeviceStatus } from '@/types/telemetry';

interface FleetStatusOverviewProps {
  devices: DeviceStatus[];
}

export const FleetStatusOverview = ({ devices }: FleetStatusOverviewProps) => {
  const fleetInsights = React.useMemo(() => {
    const onlineDevices = devices.filter(d => d.isOnline).length;
    const totalDevices = devices.length;
    const securityRisks = devices.filter(d => 
      d.telemetry?.security_info?.is_rooted || 
      d.telemetry?.device_info?.is_emulator
    ).length;

    return {
      totalDevices,
      onlineDevices,
      securityRisks
    };
  }, [devices]);

  return (
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
  );
};
