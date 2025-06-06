
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeviceMonitorButton } from './DeviceMonitorButton';
import { useDevicesQuery } from '@/hooks/useDevicesQuery';
import { Activity, AlertCircle, Battery, Wifi, Shield } from 'lucide-react';

export const DeviceStatusChecker = () => {
  const { data: devices = [] } = useDevicesQuery();
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Update last check time when devices data changes
  useEffect(() => {
    if (devices.length > 0) {
      setLastCheck(new Date());
    }
  }, [devices]);

  // Calculate quick stats
  const onlineDevices = devices.filter(device => device.isOnline).length;
  const offlineDevices = devices.length - onlineDevices;
  const lowBatteryDevices = devices.filter(device => device.battery_level < 20).length;
  const securityIssues = devices.filter(device => device.telemetry?.security_info?.is_rooted).length;

  const getStatusColor = (count: number, isGood: boolean = false) => {
    if (count === 0) return isGood ? "bg-green-500" : "bg-gray-400";
    if (count > 0 && !isGood) return "bg-red-500";
    return "bg-blue-500";
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Device Status Monitor
            </CardTitle>
            <CardDescription>
              {lastCheck ? `Last checked: ${lastCheck.toLocaleTimeString()}` : 'Not checked yet'}
            </CardDescription>
          </div>
          <DeviceMonitorButton variant="default" />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Online Status */}
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor(onlineDevices, true)}`} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{onlineDevices} Online</span>
              <span className="text-xs text-muted-foreground">Active devices</span>
            </div>
          </div>

          {/* Offline Status */}
          <div className="flex items-center gap-2">
            <AlertCircle className={`h-3 w-3 ${offlineDevices > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{offlineDevices} Offline</span>
              <span className="text-xs text-muted-foreground">Need attention</span>
            </div>
          </div>

          {/* Battery Status */}
          <div className="flex items-center gap-2">
            <Battery className={`h-3 w-3 ${lowBatteryDevices > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{lowBatteryDevices} Low Battery</span>
              <span className="text-xs text-muted-foreground">{'<20%'}</span>
            </div>
          </div>

          {/* Security Status */}
          <div className="flex items-center gap-2">
            <Shield className={`h-3 w-3 ${securityIssues > 0 ? 'text-red-500' : 'text-green-500'}`} />
            <div className="flex flex-col">
              <span className="text-sm font-medium">{securityIssues} Security Issues</span>
              <span className="text-xs text-muted-foreground">Rooted devices</span>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Status:</span>
            {offlineDevices === 0 && lowBatteryDevices === 0 && securityIssues === 0 ? (
              <Badge variant="default" className="bg-green-500 hover:bg-green-600">
                All Systems Good 🎉
              </Badge>
            ) : (
              <>
                {offlineDevices > 0 && (
                  <Badge variant="destructive">
                    {offlineDevices} Offline
                  </Badge>
                )}
                {lowBatteryDevices > 0 && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    {lowBatteryDevices} Low Battery
                  </Badge>
                )}
                {securityIssues > 0 && (
                  <Badge variant="destructive">
                    {securityIssues} Security Issues
                  </Badge>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
