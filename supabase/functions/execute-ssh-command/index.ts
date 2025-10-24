import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SSHCommandRequest {
  deviceId: string;
  command: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get request body
    const { deviceId, command }: SSHCommandRequest = await req.json();

    if (!deviceId || !command) {
      return new Response(
        JSON.stringify({ error: 'Missing deviceId or command' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get device SSH credentials from database
    const { data: device, error: deviceError } = await supabase
      .from('devices')
      .select('ssh_host, ssh_port, ssh_username, ssh_password, ip_address')
      .eq('id', deviceId)
      .single();

    if (deviceError || !device) {
      return new Response(
        JSON.stringify({ error: 'Device not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if SSH credentials are configured
    if (!device.ssh_username || !device.ssh_password) {
      return new Response(
        JSON.stringify({ error: 'SSH credentials not configured for this device' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine SSH host (prefer ssh_host, fallback to ip_address)
    const sshHost = device.ssh_host || device.ip_address;
    if (!sshHost) {
      return new Response(
        JSON.stringify({ error: 'No SSH host or IP address available for this device' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sshPort = device.ssh_port || 22;

    console.log(`Attempting SSH connection to ${sshHost}:${sshPort}`);

    // Execute SSH command using sshpass
    // Note: In production, you'd want to use a proper SSH library
    // For now, we'll use Deno.Command to execute sshpass
    const sshCommand = new Deno.Command('sshpass', {
      args: [
        '-p', device.ssh_password,
        'ssh',
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'UserKnownHostsFile=/dev/null',
        '-p', sshPort.toString(),
        `${device.ssh_username}@${sshHost}`,
        command
      ],
      stdout: 'piped',
      stderr: 'piped',
    });

    const process = sshCommand.spawn();
    const { code, stdout, stderr } = await process.output();

    const decoder = new TextDecoder();
    const output = decoder.decode(stdout);
    const errorOutput = decoder.decode(stderr);

    // Log command execution to history
    await supabase.from('device_command_history').insert({
      device_id: deviceId,
      command,
      execution_status: code === 0 ? 'success' : 'failed',
      output: code === 0 ? output : null,
      error_message: code !== 0 ? errorOutput : null,
    });

    if (code !== 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Command execution failed', 
          details: errorOutput,
          exitCode: code 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For screencap commands, we need to return the image data
    if (command.includes('screencap')) {
      // The output is raw PNG data, convert to base64
      const base64Image = btoa(output);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          output: base64Image,
          type: 'image',
          format: 'png'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        output,
        type: 'text'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('SSH command execution error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
