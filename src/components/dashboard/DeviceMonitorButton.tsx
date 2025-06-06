
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, Wifi, RotateCcw } from 'lucide-react';
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
  const [retryCount, setRetryCount] = useState(0);

  const handleMonitoring = async (isRetry = false) => {
    setIsMonitoring(true);
    if (!isRetry) {
      setLastCheckResult(null);
      setRetryCount(0);
    }
    
    try {
      console.log("🚀 Device monitoring button clicked!");
      const success = await triggerDeviceMonitoring();
      setLastCheckResult(success);
      
      if (success) {
        console.log("🎉 Device monitoring completed successfully!");
        setRetryCount(0);
      } else {
        console.log("😞 Device monitoring failed");
        if (!isRetry && retryCount < 2) {
          setRetryCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("💥 Unexpected error in button handler:", error);
      setLastCheckResult(false);
      if (!isRetry && retryCount < 2) {
        setRetryCount(prev => prev + 1);
      }
    } finally {
      setIsMonitoring(false);
    }
  };

  const handleRetry = () => {
    handleMonitoring(true);
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
      return retryCount > 0 ? "Retry Available" : "Check Failed";
    }
    
    return "Check Device Status";
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={() => handleMonitoring()}
        disabled={isMonitoring}
        variant={variant}
        size={size}
        className={`flex items-center gap-2 transition-all duration-200 ${className}`}
      >
        {getIcon()}
        {getText()}
      </Button>
      
      {lastCheckResult === false && retryCount > 0 && !isMonitoring && (
        <Button
          onClick={handleRetry}
          variant="ghost"
          size="sm"
          className="flex items-center gap-1 text-xs"
        >
          <RotateCcw className="h-3 w-3" />
          Retry
        </Button>
      )}
    </div>
  );
};
