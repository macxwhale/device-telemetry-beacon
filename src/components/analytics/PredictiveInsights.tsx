
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const PredictiveInsights = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Predictive Insights</CardTitle>
        <CardDescription>AI-powered recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Battery Optimization
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              3 devices showing unusual battery drain patterns
            </p>
          </div>
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Maintenance Alert
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-300">
              Scheduled maintenance recommended for 2 devices
            </p>
          </div>
          <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Performance
            </p>
            <p className="text-xs text-green-600 dark:text-green-300">
              Fleet performance is above baseline
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
