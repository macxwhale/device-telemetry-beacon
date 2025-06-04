
import { useEffect, memo } from 'react';
import { Layout } from '@/components/Layout';
import { DeviceAnalytics } from '@/components/dashboard/DeviceAnalytics';
import { SecurityMonitor } from '@/components/dashboard/SecurityMonitor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDevicesQuery } from '@/hooks/useDevicesQuery';
import { useRealTimeUpdates } from '@/hooks/useRealTimeUpdates';
import { ErrorMessage } from '@/components/ErrorMessage';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Shield, 
  RefreshCw, 
  Download,
  TrendingUp,
  Zap
} from 'lucide-react';
import { AdvancedAnalytics } from "@/components/analytics/AdvancedAnalytics";
import { SecurityMonitoringDashboard } from "@/components/security/SecurityMonitoringDashboard";
import { DeviceGroupManager } from "@/components/groups/DeviceGroupManager";
import { AutomationDashboard } from "@/components/automation/AutomationDashboard";

const AnalyticsPage = memo(() => {
  const navigate = useNavigate();
  const { data: devices = [], isLoading, error, refetch } = useDevicesQuery();
  const { refresh } = useRealTimeUpdates({ enabled: !isLoading });

  useEffect(() => {
    document.title = "Analytics - Device Telemetry";
  }, []);

  const handleRefresh = () => {
    refetch();
    refresh();
  };

  const handleViewDevice = (deviceId: string) => {
    navigate(`/device/${deviceId}`);
  };

  const handleExportReport = () => {
    // Create analytics report
    const report = {
      timestamp: new Date().toISOString(),
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.isOnline).length,
      analytics: {
        manufacturerDistribution: devices.reduce((acc, device) => {
          const manufacturer = device.manufacturer || 'Unknown';
          acc[manufacturer] = (acc[manufacturer] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        osVersionDistribution: devices.reduce((acc, device) => {
          const version = device.os_version || 'Unknown';
          acc[version] = (acc[version] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageBattery: devices.length > 0 
          ? devices.reduce((sum, d) => sum + d.battery_level, 0) / devices.length 
          : 0,
        securityIssues: devices.filter(d => 
          d.telemetry?.security_info?.is_rooted || 
          d.telemetry?.device_info?.is_emulator
        ).length
      },
      devices: devices.map(device => ({
        id: device.id,
        name: device.name,
        manufacturer: device.manufacturer,
        model: device.model,
        isOnline: device.isOnline,
        batteryLevel: device.battery_level,
        lastSeen: device.last_seen,
        securityStatus: {
          isRooted: device.telemetry?.security_info?.is_rooted || false,
          isEmulator: device.telemetry?.device_info?.is_emulator || false
        }
      }))
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Layout>
        <ErrorMessage 
          message="Failed to load analytics data" 
          onRetry={handleRefresh} 
        />
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Advanced Analytics & Automation</h1>
          <p className="text-muted-foreground">
            Comprehensive insights, automation, and integrations for your device fleet
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="automation">Automation</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analytics" className="space-y-6">
            <AdvancedAnalytics devices={devices} />
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <SecurityMonitoringDashboard />
          </TabsContent>
          
          <TabsContent value="automation" className="space-y-6">
            <AutomationDashboard />
          </TabsContent>
          
          <TabsContent value="groups" className="space-y-6">
            <DeviceGroupManager />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
});

AnalyticsPage.displayName = 'AnalyticsPage';

export default AnalyticsPage;
