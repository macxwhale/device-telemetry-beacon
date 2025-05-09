
import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { TelemetryClient } from "@/api/telemetry-client";
import { Loader2, PlayCircle, RefreshCw, CheckCircle } from "lucide-react";

const TestApiPage = () => {
  const [deviceId, setDeviceId] = useState(`device_${Math.floor(Math.random() * 100000)}`);
  const [deviceName, setDeviceName] = useState("Test Device");
  const [manufacturer, setManufacturer] = useState("Test Manufacturer");
  const [model, setModel] = useState("Test Model");
  const [batteryLevel, setBatteryLevel] = useState(80);
  const [responseData, setResponseData] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [fullJson, setFullJson] = useState("");
  
  // Generate full JSON template on load
  useEffect(() => {
    generateFullJsonTemplate();
  }, []);

  // Generate JSON template with current values
  const generateFullJsonTemplate = () => {
    const fullTemplate = TelemetryClient.generateSampleTelemetry({
      android_id: deviceId,
      device_name: deviceName,
      manufacturer: manufacturer,
      model: model,
      battery_level: parseInt(batteryLevel.toString(), 10)
    });
    
    setFullJson(JSON.stringify(fullTemplate, null, 2));
  };
  
  // Generate new random sample data
  const generateNewSample = () => {
    const newDeviceId = `device_${Math.floor(Math.random() * 100000)}`;
    const newDeviceName = `Test Device ${Math.floor(Math.random() * 100)}`;
    const manufacturers = ["Samsung", "Apple", "Google", "Xiaomi", "Huawei"];
    const newManufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
    const newModel = `Model-${Math.floor(Math.random() * 1000)}`;
    const newBatteryLevel = Math.floor(Math.random() * 100);
    
    setDeviceId(newDeviceId);
    setDeviceName(newDeviceName);
    setManufacturer(newManufacturer);
    setModel(newModel);
    setBatteryLevel(newBatteryLevel);
    
    // Update the full JSON template with new values
    setTimeout(() => {
      generateFullJsonTemplate();
    }, 0);
  };
  
  // Handle sending full JSON
  const handleSendFullJson = async () => {
    setIsLoading(true);
    try {
      // Parse full JSON or show an error
      let fullData = {};
      try {
        fullData = JSON.parse(fullJson);
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
      console.log("Sending telemetry data:", fullData);
      
      // Make the API call
      const response = await TelemetryClient.sendTelemetry(fullData);
      const data = await response.json();
      
      // Update response display
      setResponseData(JSON.stringify(data, null, 2));
      
      // Show success toast
      toast({
        title: "Telemetry Sent",
        description: "Successfully sent telemetry data",
      });
    } catch (error) {
      console.error("Failed to send telemetry:", error);
      setResponseData(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
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
        
        <Card>
          <CardHeader>
            <CardTitle>JSON Telemetry Template</CardTitle>
            <CardDescription>
              Edit and send a complete telemetry data structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium">Complete Telemetry Structure</div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={generateFullJsonTemplate}
                >
                  Regenerate
                </Button>
              </div>
              <Textarea 
                value={fullJson} 
                onChange={(e) => setFullJson(e.target.value)} 
                className="font-mono h-[300px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSendFullJson} className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Send Telemetry Data
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
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
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>API Key Information</CardTitle>
            <CardDescription>
              For your reference when testing the API
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                <strong className="mr-2">API Key:</strong>
                <code className="bg-secondary px-2 py-0.5 rounded">telm_sk_1234567890abcdef</code>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                <strong className="mr-2">Header:</strong>
                <code className="bg-secondary px-2 py-0.5 rounded">Authorization: Bearer telm_sk_1234567890abcdef</code>
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                <strong className="mr-2">Endpoint:</strong>
                <code className="bg-secondary px-2 py-0.5 rounded">/api/telemetry</code>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TestApiPage;
