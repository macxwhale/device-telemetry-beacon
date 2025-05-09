
const DatabaseStats = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Database Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-secondary p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Devices</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-secondary p-4 rounded-md">
          <p className="text-sm text-muted-foreground">Telemetry Records</p>
          <p className="text-2xl font-bold">0</p>
        </div>
        <div className="bg-secondary p-4 rounded-md">
          <p className="text-sm text-muted-foreground">App Records</p>
          <p className="text-2xl font-bold">0</p>
        </div>
      </div>
    </div>
  );
};

export default DatabaseStats;
