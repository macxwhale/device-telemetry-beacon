
import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { TelemetryClient } from "@/api/telemetry-client";
import { Loader2, PlayCircle, RefreshCw } from "lucide-react";

const TestApiPage = () => {
  const [deviceId, setDeviceId] = useState(`device_${Math.floor(Math.random() * 100000)}`);
  const [deviceName, setDeviceName] = useState("Test Device");
  const [manufacturer, setManufacturer] = useState("Test Manufacturer");
  const [model, setModel] = useState("Test Model");
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [customJson, setCustomJson] = useState("");
  const [responseData, setResponseData] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle sending the test telemetry data
  const handleSendTelemetry = async () => {
    setIsLoading(true);
    try {
      // Generate telemetry data based on form fields
      const telemetryData = TelemetryClient.generateSampleTelemetry({
        android_id: deviceId,
        device_name: deviceName,
        manufacturer: manufacturer,
        model: model,
        battery_level: parseInt(batteryLevel.toString(), 10)
      });
      
      // Log what we're sending
      console.log("Sending telemetry data:", telemetryData);
      
      // Make the API call
      const response = await TelemetryClient.sendTelemetry(telemetryData);
      const data = await response.json();
      
      // Update response display
      setResponseData(JSON.stringify(data, null, 2));
      
      // Show success toast
      toast({
        title: "Telemetry Sent",
        description: `Successfully sent telemetry data for ${deviceName}`,
      });
    } catch (error) {
      console.error("Failed to send telemetry:", error);
      setResponseData(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sending custom JSON
  const handleSendCustomJson = async () => {
    setIsLoading(true);
    try {
      // Parse custom JSON or show an error
      let customData = {};
      try {
        customData = JSON.parse(customJson);
      } catch (parseError) {
        toast({
          title: "Invalid JSON",
          description: "Please enter valid JSON data",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Log what we're sending
      console.log("Sending custom telemetry data:", customData);
      
      // Make the API call
      const response = await TelemetryClient.sendTelemetry(customData);
      const data = await response.json();
      
      // Update response display
      setResponseData(JSON.stringify(data, null, 2));
      
      // Show success toast
      toast({
        title: "Custom Telemetry Sent",
        description: "Successfully sent custom telemetry data",
      });
    } catch (error) {
      console.error("Failed to send custom telemetry:", error);
      setResponseData(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate new random sample data
  const generateNewSample = () => {
    setDeviceId(`device_${Math.floor(Math.random() * 100000)}`);
    setDeviceName(`Test Device ${Math.floor(Math.random() * 100)}`);
    setManufacturer(["Samsung", "Apple", "Google", "Xiaomi", "Huawei"][Math.floor(Math.random() * 5)]);
    setModel(`Model-${Math.floor(Math.random() * 1000)}`);
    setBatteryLevel(Math.floor(Math.random() * 100));
  };
  
  // Format the response data
  const formattedResponse = responseData ? (
    <pre className="bg-secondary p-4 rounded-md overflow-auto max-h-[300px] text-xs">
      {responseData}
    </pre>
  ) : null;
  
  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Test Telemetry API</h1>
          <Button onClick={generateNewSample} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate New Sample
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic form for simple telemetry */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Device Telemetry</CardTitle>
              <CardDescription>
                Send basic telemetry data using a simple form.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deviceId">Device ID</Label>
                <Input 
                  id="deviceId" 
                  value={deviceId} 
                  onChange={(e) => setDeviceId(e.target.value)} 
                  placeholder="Enter device ID" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input 
                  id="deviceName" 
                  value={deviceName} 
                  onChange={(e) => setDeviceName(e.target.value)} 
                  placeholder="Enter device name" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input 
                    id="manufacturer" 
                    value={manufacturer} 
                    onChange={(e) => setManufacturer(e.target.value)} 
                    placeholder="Manufacturer" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input 
                    id="model" 
                    value={model} 
                    onChange={(e) => setModel(e.target.value)} 
                    placeholder="Model" 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="batteryLevel">Battery Level ({batteryLevel}%)</Label>
                <Input 
                  id="batteryLevel" 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={batteryLevel} 
                  onChange={(e) => setBatteryLevel(parseInt(e.target.value, 10))} 
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSendTelemetry} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Send Telemetry
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Advanced form for custom JSON */}
          <Card>
            <CardHeader>
              <CardTitle>Custom JSON Telemetry</CardTitle>
              <CardDescription>
                Send any custom JSON data to the telemetry API.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="customJson">Custom JSON Data</Label>
                <Textarea 
                  id="customJson" 
                  value={customJson} 
                  onChange={(e) => setCustomJson(e.target.value)} 
                  placeholder='{"device_info": {"android_id": "custom123", "device_name": "Custom Device"}, "battery_info": {"battery_level": 75}}' 
                  className="font-mono h-[200px]"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSendCustomJson} className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Send Custom JSON
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>API Response</CardTitle>
            <CardDescription>
              The response from the telemetry API will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {formattedResponse || (
              <div className="bg-secondary p-4 rounded-md text-center text-muted-foreground">
                No response data yet. Send telemetry to see the response.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TestApiPage;
