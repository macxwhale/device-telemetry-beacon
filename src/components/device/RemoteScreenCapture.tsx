import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Loader2, Settings, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SSHCredentialsDialog } from "./SSHCredentialsDialog";

interface RemoteScreenCaptureProps {
  deviceId: string;
  hasSSHCredentials: boolean;
}

export function RemoteScreenCapture({ deviceId, hasSSHCredentials }: RemoteScreenCaptureProps) {
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [showScreenshot, setShowScreenshot] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  const captureScreen = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('execute-ssh-command', {
        body: {
          deviceId,
          command: 'screencap -p',
        },
      });

      if (error) throw error;

      if (data.success && data.type === 'image') {
        setScreenshot(data.output);
        setShowScreenshot(true);
        toast({
          title: "Screenshot captured",
          description: "SSH connection successful, screenshot ready to view",
        });
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Screenshot error:', error);
      toast({
        title: "Screenshot failed",
        description: error.message || "Failed to capture device screen",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCapture = () => {
    if (!hasSSHCredentials) {
      toast({
        title: "SSH not configured",
        description: "Please configure SSH credentials first",
        variant: "destructive",
      });
      setShowCredentials(true);
      return;
    }
    captureScreen();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Remote Screen Capture
          </CardTitle>
          <CardDescription>
            Capture the current device screen via SSH
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleCapture}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Capturing...
                </>
              ) : (
                <>
                  <Monitor className="mr-2 h-4 w-4" />
                  Capture Screen
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCredentials(true)}
              className="flex-1 sm:flex-none"
            >
              <Settings className="mr-2 h-4 w-4" />
              SSH Settings
            </Button>
          </div>

          {!hasSSHCredentials && (
            <div className="p-3 bg-warning/10 border border-warning/20 rounded-md">
              <p className="text-sm text-warning-foreground">
                SSH credentials not configured. Click "SSH Settings" to set up remote access.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Screenshot Preview Dialog */}
      <Dialog open={showScreenshot} onOpenChange={setShowScreenshot}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Device Screenshot</DialogTitle>
            <DialogDescription>
              Current device screen captured via SSH
            </DialogDescription>
          </DialogHeader>
          {screenshot && (
            <div className="space-y-4">
              <img
                src={`data:image/png;base64,${screenshot}`}
                alt="Device screenshot"
                className="w-full h-auto rounded-lg border"
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => captureScreen()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
                <Button onClick={() => setShowScreenshot(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* SSH Credentials Dialog */}
      <SSHCredentialsDialog
        open={showCredentials}
        onOpenChange={setShowCredentials}
        deviceId={deviceId}
        onSaved={() => window.location.reload()}
      />
    </>
  );
}
