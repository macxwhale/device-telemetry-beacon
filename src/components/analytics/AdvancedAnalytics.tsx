
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeviceStatus } from '@/types/telemetry';
import { AdvancedAnalyticsPanel } from './AdvancedAnalyticsPanel';
import { RealTimeAnalyticsDashboard } from './RealTimeAnalyticsDashboard';
import { 
  BarChart3, 
  Activity, 
  TrendingUp,
  Eye
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  devices: DeviceStatus[];
}

export const AdvancedAnalytics = ({ devices }: AdvancedAnalyticsProps) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Advanced Analytics</h2>
        <p className="text-muted-foreground">
          Real-time insights, predictive analytics, and comprehensive device intelligence
        </p>
      </div>

      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="realtime" className="flex items-center space-x-2">
            <Activity className="h-4 w-4" />
            <span>Real-time</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Insights</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <RealTimeAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="analytics">
          <AdvancedAnalyticsPanel 
            devices={devices} 
            selectedDeviceId={selectedDeviceId}
          />
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Predictive Insights</span>
                </CardTitle>
                <CardDescription>
                  AI-powered predictions and recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-blue-800 dark:text-blue-200">
                      Battery Optimization Opportunity
                    </h4>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                      Based on usage patterns, 3 devices could benefit from optimized charging schedules.
                    </p>
                  </div>
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                      Maintenance Prediction
                    </h4>
                    <p className="text-sm text-yellow-600 dark:text-yellow-300 mt-1">
                      Device performance degradation detected. Recommend maintenance within 2 weeks.
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <h4 className="font-medium text-green-800 dark:text-green-200">
                      Fleet Performance
                    </h4>
                    <p className="text-sm text-green-600 dark:text-green-300 mt-1">
                      Overall fleet health is excellent. Performance is 15% above baseline.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Benchmarks</CardTitle>
                <CardDescription>
                  Compare your fleet against industry standards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Device Uptime</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }} />
                      </div>
                      <span className="text-sm font-medium">95%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Security Score</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '88%' }} />
                      </div>
                      <span className="text-sm font-medium">88%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Battery Efficiency</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '72%' }} />
                      </div>
                      <span className="text-sm font-medium">72%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Network Performance</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '91%' }} />
                      </div>
                      <span className="text-sm font-medium">91%</span>
                    </div>
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
