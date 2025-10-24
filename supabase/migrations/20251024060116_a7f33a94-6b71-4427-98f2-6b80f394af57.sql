-- Add SSH credentials to devices table
ALTER TABLE public.devices 
ADD COLUMN ssh_host TEXT,
ADD COLUMN ssh_port INTEGER DEFAULT 22,
ADD COLUMN ssh_username TEXT,
ADD COLUMN ssh_password TEXT;

-- Add index for faster lookups
CREATE INDEX idx_devices_ssh_enabled ON public.devices(ssh_username) WHERE ssh_username IS NOT NULL;

-- Create table for storing command execution history (optional, for audit trail)
CREATE TABLE public.device_command_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID NOT NULL REFERENCES public.devices(id) ON DELETE CASCADE,
  command TEXT NOT NULL,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  execution_status TEXT NOT NULL DEFAULT 'pending',
  output TEXT,
  error_message TEXT,
  executed_by UUID
);

-- Enable RLS on command history
ALTER TABLE public.device_command_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to access command history
CREATE POLICY "Allow authenticated users to access command history"
ON public.device_command_history
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_command_history_device ON public.device_command_history(device_id, executed_at DESC);