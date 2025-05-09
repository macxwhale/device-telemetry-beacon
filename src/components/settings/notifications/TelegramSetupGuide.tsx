
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const TelegramSetupGuide = () => {
  return (
    <Alert>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>How to create a Telegram bot</AlertTitle>
      <AlertDescription>
        1. Open Telegram and search for <strong>@BotFather</strong><br />
        2. Send the command <code>/newbot</code> and follow instructions<br />
        3. Copy the bot token provided by BotFather<br />
        4. Start a chat with your bot and get the Chat ID from <strong>@userinfobot</strong>
      </AlertDescription>
    </Alert>
  );
};

export default TelegramSetupGuide;
