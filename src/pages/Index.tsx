
import { useEffect } from "react";
import { Layout } from "@/components/Layout";
import { DeviceStats } from "@/components/dashboard/DeviceStats";
import { DeviceOverview } from "@/components/dashboard/DeviceOverview";
import { DeviceStatusCard } from "@/components/dashboard/DeviceStatusCard";
import { useDevices } from "@/contexts/DeviceContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

const Index = () => {
  const { devices, loading, error, refreshDevices } = useDevices();
  
  useEffect(() => {
    // Page title
    document.title = "Device Telemetry Dashboard";
  }, []);
  
  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Device Telemetry Dashboard</h1>
        <Button variant="outline" size="sm" onClick={refreshDevices}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-[400px] mt-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-60" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Overview */}
          <DeviceStats devices={devices} />
          
          {/* Charts and Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Device Overview */}
            <DeviceOverview devices={devices} />
            
            {/* Recent Activity */}
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>System Info</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  This dashboard shows real-time telemetry data from connected devices. 
                  Devices report telemetry every 15 minutes and are marked offline if no data 
                  is received within that timeframe.
                </p>
                <div className="mt-4">
                  <p className="text-sm font-medium">API Endpoint:</p>
                  <code className="text-xs bg-secondary p-2 rounded block mt-1 overflow-x-auto">
                    POST /api/telemetry
                  </code>
                </div>
                <div className="mt-4">
                  <p className="text-sm font-medium">Current Time:</p>
                  <p className="text-sm">
                    {new Date().toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Device List */}
          <div>
            <h2 className="text-lg font-medium mb-3">Recent Devices</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {devices.slice(0, 4).map(device => (
                <DeviceStatusCard key={device.id} device={device} />
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Index;

// Card component used above
const Card = ({ className, ...props }: React.ComponentProps<typeof import("@/components/ui/card").Card>) => {
  const { Card } = require("@/components/ui/card");
  return <Card className={className} {...props} />;
};

const CardHeader = (props: React.ComponentProps<typeof import("@/components/ui/card").CardHeader>) => {
  const { CardHeader } = require("@/components/ui/card");
  return <CardHeader {...props} />;
};

const CardTitle = (props: React.ComponentProps<typeof import("@/components/ui/card").CardTitle>) => {
  const { CardTitle } = require("@/components/ui/card");
  return <CardTitle {...props} />;
};

const CardContent = (props: React.ComponentProps<typeof import("@/components/ui/card").CardContent>) => {
  const { CardContent } = require("@/components/ui/card");
  return <CardContent {...props} />;
};
