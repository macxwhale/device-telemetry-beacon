
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import { DeviceAnalytics } from '@/types/groups';

interface RecentAnalyticsEventsProps {
  analytics: DeviceAnalytics[];
}

export const RecentAnalyticsEvents = ({ analytics }: RecentAnalyticsEventsProps) => {
  return (
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
  );
};
