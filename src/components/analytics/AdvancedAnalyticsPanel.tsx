
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDeviceAnalytics, useDeviceHealthScore, useDeviceUsagePatterns } from '@/hooks/useAdvancedAnalytics';
import { DeviceStatus } from '@/types/telemetry';
import { FleetOverviewCards } from './FleetOverviewCards';
import { FleetStatusOverview } from './FleetStatusOverview';
import { RecentAnalyticsEvents } from './RecentAnalyticsEvents';
import { BatteryTrendChart } from './BatteryTrendChart';
import { ManufacturerDistributionChart } from './ManufacturerDistributionChart';
import { PerformanceMetrics } from './PerformanceMetrics';
import { PredictiveInsights } from './PredictiveInsights';

interface AdvancedAnalyticsPanelProps {
  devices: DeviceStatus[];
  selectedDeviceId?: string;
}

export const AdvancedAnalyticsPanel = ({ devices, selectedDeviceId }: AdvancedAnalyticsPanelProps) => {
  const { data: analytics = [] } = useDeviceAnalytics();
  const { data: healthScore = 0 } = useDeviceHealthScore(selectedDeviceId || '');
  const { data: usagePatterns = [] } = useDeviceUsagePatterns(selectedDeviceId || '');

  return (
    <div className="space-y-6">
      <FleetOverviewCards 
        devices={devices} 
        selectedDeviceId={selectedDeviceId}
        healthScore={healthScore}
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FleetStatusOverview devices={devices} />
            <RecentAnalyticsEvents analytics={analytics} />
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <BatteryTrendChart usagePatterns={usagePatterns} selectedDeviceId={selectedDeviceId} />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <ManufacturerDistributionChart devices={devices} />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PerformanceMetrics />
            <PredictiveInsights />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
