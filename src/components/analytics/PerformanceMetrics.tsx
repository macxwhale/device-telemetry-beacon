
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const PerformanceMetrics = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Metrics</CardTitle>
        <CardDescription>Key performance indicators</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Average Response Time</span>
            <Badge variant="outline">&lt; 100ms</Badge>
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
  );
};
