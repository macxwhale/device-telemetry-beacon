
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, Wifi } from 'lucide-react';
import { triggerDeviceMonitoring } from '@/services/deviceMonitorService';

interface DeviceMonitorButtonProps {
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export const DeviceMonitorButton = ({ 
  className = "",
  variant = "outline",
  size = "default"
}: DeviceMonitorButtonProps) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<boolean | null>(null);

  const handleMonitoring = async () => {
    setIsMonitoring(true);
    setLastCheckResult(null);
    
    try {
      console.log("🚀 Device monitoring button clicked!");
      const success = await triggerDeviceMonitoring();
      setLastCheckResult(success);
      
      if (success) {
        console.log("🎉 Device monitoring completed successfully!");
      } else {
        console.log("😞 Device monitoring failed");
      }
    } catch (error) {
      console.error("💥 Unexpected error in button handler:", error);
      setLastCheckResult(false);
    } finally {
      setIsMonitoring(false);
    }
  };

  // Choose the right icon based on state
  const getIcon = () => {
    if (isMonitoring) {
      return <AlertTriangle className="h-4 w-4 animate-spin" />;
    }
    
    if (lastCheckResult === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (lastCheckResult === false) {
      return <Wifi className="h-4 w-4 text-red-500" />;
    }
    
    return <Shield className="h-4 w-4" />;
  };

  // Choose the right text based on state
  const getText = () => {
    if (isMonitoring) {
      return "Monitoring...";
    }
    
    if (lastCheckResult === true) {
      return "Status Checked ✓";
    }
    
    if (lastCheckResult === false) {
      return "Check Failed";
    }
    
    return "Check Device Status";
  };

  return (
    <Button
      onClick={handleMonitoring}
      disabled={isMonitoring}
      variant={variant}
      size={size}
      className={`flex items-center gap-2 transition-all duration-200 ${className}`}
    >
      {getIcon()}
      {getText()}
    </Button>
  );
};
