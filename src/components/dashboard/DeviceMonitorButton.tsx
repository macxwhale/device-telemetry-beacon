
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle } from 'lucide-react';
import { triggerDeviceMonitoring } from '@/services/deviceMonitorService';

export const DeviceMonitorButton = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);

  const handleMonitoring = async () => {
    setIsMonitoring(true);
    try {
      await triggerDeviceMonitoring();
    } finally {
      setIsMonitoring(false);
    }
  };

  return (
    <Button
      onClick={handleMonitoring}
      disabled={isMonitoring}
      variant="outline"
      className="flex items-center gap-2"
    >
      {isMonitoring ? (
        <>
          <AlertTriangle className="h-4 w-4 animate-spin" />
          Monitoring...
        </>
      ) : (
        <>
          <Shield className="h-4 w-4" />
          Check Device Status
        </>
      )}
    </Button>
  );
};
