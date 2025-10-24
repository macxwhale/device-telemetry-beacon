import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Terminal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SSHCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceId: string;
  onSaved?: () => void;
}

export function SSHCredentialsDialog({
  open,
  onOpenChange,
  deviceId,
  onSaved,
}: SSHCredentialsDialogProps) {
  const [sshHost, setSSHHost] = useState("");
  const [sshPort, setSSHPort] = useState("22");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username || !password) {
      toast({
        title: "Missing credentials",
        description: "Please provide username and password",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("devices")
        .update({
          ssh_host: sshHost || null,
          ssh_port: parseInt(sshPort) || 22,
          ssh_username: username,
          ssh_password: password,
        })
        .eq("id", deviceId);

      if (error) throw error;

      toast({
        title: "SSH credentials saved",
        description: "You can now execute remote commands on this device",
      });

      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving SSH credentials:", error);
      toast({
        title: "Error",
        description: "Failed to save SSH credentials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Configure SSH Credentials
          </DialogTitle>
          <DialogDescription>
            Set up SSH access to execute remote commands on this device
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ssh-host">
              SSH Host (optional, uses device IP if not set)
            </Label>
            <Input
              id="ssh-host"
              placeholder="192.168.1.100"
              value={sshHost}
              onChange={(e) => setSSHHost(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ssh-port">SSH Port</Label>
            <Input
              id="ssh-port"
              type="number"
              placeholder="22"
              value={sshPort}
              onChange={(e) => setSSHPort(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="root"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
