
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const DatabaseOperations = () => {
  return (
    <div className="border-t pt-4">
      <h3 className="text-sm font-medium mb-2">Database Operations</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Initialize or verify the database tables and connections.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={() => toast.info("This feature is currently disabled.")} 
        >
          Initialize/Verify Database
        </Button>
      </div>
    </div>
  );
};

export default DatabaseOperations;
