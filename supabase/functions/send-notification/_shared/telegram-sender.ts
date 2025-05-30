
import { checkTelegramRateLimit, markNotificationSent } from './rate-limiter.ts';
import type { NotificationResult } from './types.ts';

export async function sendTelegramNotification(
  message: string,
  type: string,
  deviceId: string | undefined,
  deviceName: string | undefined,
  botToken: string,
  chatId: string
): Promise<NotificationResult> {
  try {
    // Check Telegram rate limit
    if (!checkTelegramRateLimit(chatId)) {
      return {
        channel: 'telegram',
        success: false,
        error: 'Rate limit exceeded - too many messages sent recently'
      };
    }

    // Format notification message
    let formattedMessage = message;
    
    if (deviceId && deviceName) {
      formattedMessage = `[${deviceName} (${deviceId})]: ${message}`;
    }
    
    // Add notification type emoji
    let emoji = '📱';
    switch (type) {
      case 'device_offline': emoji = '🔌'; break;
      case 'low_battery': emoji = '🪫'; break;
      case 'security_issue': emoji = '⚠️'; break;
      case 'new_device': emoji = '🆕'; break;
      case 'test': emoji = '🧪'; break;
    }
    
    formattedMessage = `${emoji} ${formattedMessage}`;
    
    // Use Telegram Bot API to send message
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: formattedMessage,
        parse_mode: 'HTML'
      })
    });
    
    const telegramData = await telegramResponse.json();
    
    if (telegramData.ok) {
      // Mark notification as sent for rate limiting
      if (type !== 'test' && deviceId) {
        markNotificationSent(deviceId, type);
      }
      
      console.log(`Telegram notification sent successfully: ${formattedMessage}`);
    }
    
    return {
      channel: 'telegram',
      success: telegramData.ok === true,
      response: telegramData
    };
  } catch (telegramError) {
    console.error('Error sending Telegram notification:', telegramError);
    return {
      channel: 'telegram',
      success: false,
      error: telegramError.message
    };
  }
}
