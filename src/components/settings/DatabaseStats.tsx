
import { useEffect, useState } from "react";
import { getDatabaseStats } from "@/services/databaseService";

const DatabaseStats = () => {
  const [stats, setStats] = useState({
    devices: 0,
    telemetry_records: 0,
    apps: 0,
    isLoading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dbStats = await getDatabaseStats();
        if (dbStats) {
          setStats({
            ...dbStats,
            isLoading: false
          });
        } else {
          setStats(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error("Error fetching database stats:", error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Database Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Devices</p>
          <p className="text-2xl font-bold">
            {stats.isLoading ? "Loading..." : stats.devices}
          </p>
        </div>
        <div className="bg-secondary p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Telemetry Records</p>
          <p className="text-2xl font-bold">
            {stats.isLoading ? "Loading..." : stats.telemetry_records}
          </p>
        </div>
        <div className="bg-secondary p-4 rounded-md">
          <p className="text-sm text-muted-foreground">App Records</p>
          <p className="text-2xl font-bold">
            {stats.isLoading ? "Loading..." : stats.apps}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStats;
