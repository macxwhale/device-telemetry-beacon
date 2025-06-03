
export async function createNotificationSender(supabase: any) {
  return async function sendNotification(deviceId: string, deviceName: string, message: string, type: string) {
    try {
      const response = await supabase.functions.invoke('send-notification', {
        body: {
          message,
          type,
          deviceId,
          deviceName
        }
      });
      
      if (response.error) {
        console.error("Error sending notification:", response.error);
      } else {
        console.log(`${type} notification sent for device: ${deviceName}`);
      }
    } catch (error) {
      console.error("Exception while sending notification:", error);
    }
  };
}
