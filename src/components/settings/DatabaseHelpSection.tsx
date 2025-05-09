
const DatabaseHelpSection = () => {
  return (
    <>
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-2">Database Initialization Process</h3>
        <p className="text-sm text-muted-foreground">
          When you click "Initialize/Verify Database", the following steps are performed:
        </p>
        <ol className="list-decimal list-inside text-sm text-muted-foreground mt-2 space-y-1 pl-2">
          <li>Create database functions for SQL execution and data processing</li>
          <li>Create required tables if they don't exist (devices, telemetry_history, device_apps)</li>
          <li>Set up triggers for automatic data processing</li>
          <li>Enable realtime updates for live data monitoring</li>
        </ol>
        <p className="text-sm text-muted-foreground mt-2">
          This process is safe to run multiple times and will only create tables and functions if they don't exist.
        </p>
      </div>
      
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-2">About Database Storage</h3>
        <p className="text-sm text-muted-foreground">
          All device telemetry data is automatically stored in the database. The database structure includes:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
          <li><strong>devices</strong> - Basic device information (IDs, names, models)</li>
          <li><strong>telemetry_history</strong> - Complete telemetry data history</li>
          <li><strong>device_apps</strong> - List of applications installed on each device</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-2">
          All data is automatically persisted and retrievable for historical analysis.
        </p>
      </div>
    </>
  );
};

export default DatabaseHelpSection;
