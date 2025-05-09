
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DatabaseStats from "./DatabaseStats";
import DatabaseOperations from "./DatabaseOperations";
import DatabaseSetupSQL from "./DatabaseSetupSQL";
import DatabaseHelpSection from "./DatabaseHelpSection";

const DatabaseTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Configuration</CardTitle>
        <CardDescription>
          Manage the database connection for telemetry data storage.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <DatabaseStats />
          <DatabaseOperations />
          <DatabaseSetupSQL />
          <DatabaseHelpSection />
        </div>
      </CardContent>
    </Card>
  );
};

export default DatabaseTab;
