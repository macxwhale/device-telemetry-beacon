
import { FC, memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DeviceStatus } from '@/types/telemetry';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Eye,
  Lock,
  Unlock,
  Smartphone
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SecurityMonitorProps {
  devices: DeviceStatus[];
  onViewDevice?: (deviceId: string) => void;
}

interface SecurityIssue {
  deviceId: string;
  deviceName: string;
  issueType: 'rooted' | 'emulator' | 'unknown_app' | 'outdated_os';
  severity: 'high' | 'medium' | 'low';
  description: string;
  lastSeen: number;
}

export const SecurityMonitor: FC<SecurityMonitorProps> = memo(({ devices, onViewDevice }) => {
  const securityData = useMemo(() => {
    const issues: SecurityIssue[] = [];
    let secureDevices = 0;
    let totalDevices = devices.length;

    devices.forEach(device => {
      let deviceSecure = true;

      // Check for rooted devices
      if (device.telemetry?.security_info?.is_rooted) {
        deviceSecure = false;
        issues.push({
          deviceId: device.id,
          deviceName: device.name,
          issueType: 'rooted',
          severity: 'high',
          description: 'Device has been rooted, security compromised',
          lastSeen: device.last_seen
        });
      }

      // Check for emulators
      if (device.telemetry?.device_info?.is_emulator) {
        deviceSecure = false;
        issues.push({
          deviceId: device.id,
          deviceName: device.name,
          issueType: 'emulator',
          severity: 'medium',
          description: 'Device is running on an emulator',
          lastSeen: device.last_seen
        });
      }

      // Check for outdated OS
      if (device.telemetry?.system_info?.sdk_int && device.telemetry.system_info.sdk_int < 28) {
        deviceSecure = false;
        issues.push({
          deviceId: device.id,
          deviceName: device.name,
          issueType: 'outdated_os',
          severity: 'medium',
          description: `Outdated Android version (API ${device.telemetry.system_info.sdk_int})`,
          lastSeen: device.last_seen
        });
      }

      if (deviceSecure) {
        secureDevices++;
      }
    });

    return {
      totalDevices,
      secureDevices,
      issuesCount: issues.length,
      issues: issues.sort((a, b) => {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      }),
      securityScore: totalDevices > 0 ? Math.round((secureDevices / totalDevices) * 100) : 100
    };
  }, [devices]);

  const getSeverityIcon = (severity: SecurityIssue['severity']) => {
    switch (severity) {
      case 'high':
        return <ShieldAlert className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <Shield className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSeverityBadge = (severity: SecurityIssue['severity']) => {
    const variants = {
      high: 'destructive' as const,
      medium: 'secondary' as const,
      low: 'outline' as const
    };
    return variants[severity];
  };

  const getIssueTypeIcon = (issueType: SecurityIssue['issueType']) => {
    switch (issueType) {
      case 'rooted':
        return <Unlock className="h-4 w-4" />;
      case 'emulator':
        return <Smartphone className="h-4 w-4" />;
      case 'outdated_os':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{securityData.securityScore}%</div>
              {securityData.securityScore >= 90 ? (
                <ShieldCheck className="h-5 w-5 text-green-500" />
              ) : securityData.securityScore >= 70 ? (
                <Shield className="h-5 w-5 text-yellow-500" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Secure Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-green-600">
                {securityData.secureDevices}
              </div>
              <div className="text-sm text-muted-foreground">
                / {securityData.totalDevices}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-red-600">
                {securityData.issuesCount}
              </div>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Issues List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Security Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          {securityData.issues.length === 0 ? (
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                No security issues detected. All devices appear to be secure.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {securityData.issues.map((issue, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{issue.deviceName}</span>
                        <Badge variant={getSeverityBadge(issue.severity)}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {getIssueTypeIcon(issue.issueType)}
                        <span>{issue.description}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last seen {formatDistanceToNow(new Date(issue.lastSeen), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDevice?.(issue.deviceId)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Enable automatic security scanning to detect new threats in real-time.
            </AlertDescription>
          </Alert>
          
          {securityData.issues.some(i => i.issueType === 'rooted') && (
            <Alert>
              <ShieldAlert className="h-4 w-4" />
              <AlertDescription>
                Rooted devices detected. Consider implementing additional security measures or removing these devices from sensitive operations.
              </AlertDescription>
            </Alert>
          )}
          
          {securityData.issues.some(i => i.issueType === 'outdated_os') && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Some devices are running outdated Android versions. Update to the latest security patches.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

SecurityMonitor.displayName = 'SecurityMonitor';
