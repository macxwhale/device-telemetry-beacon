
import { FC } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export const SystemInfoCard: FC = () => {
  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg md:text-xl">System Info</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-xs sm:text-sm">
          This dashboard shows real-time telemetry data from connected devices. 
          Devices report telemetry every 15 minutes and are marked offline if no data 
          is received within that timeframe.
        </p>
        <div className="mt-4">
          <p className="text-xs sm:text-sm font-medium">API Endpoint:</p>
          <code className="text-[10px] sm:text-xs bg-secondary p-2 rounded block mt-1 overflow-x-auto">
            POST /api/telemetry
          </code>
        </div>
        <div className="mt-4">
          <p className="text-xs sm:text-sm font-medium">Current Time:</p>
          <p className="text-xs sm:text-sm">
            {new Date().toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
