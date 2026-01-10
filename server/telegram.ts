import TelegramBot from 'node-telegram-bot-api';

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

let bot: TelegramBot | null = null;

// Initialize bot only if credentials are available
if (token && chatId) {
  try {
    bot = new TelegramBot(token, { polling: false });
    console.log('Telegram bot initialized successfully');
  } catch (error) {
    console.warn('Failed to initialize Telegram bot:', error);
    bot = null;
  }
} else {
  console.warn('Telegram credentials not configured - alert functionality will be disabled');
}

export async function sendTelegramAlert(message: string): Promise<void> {
  if (!bot || !chatId) {
    console.warn('Telegram alert skipped: Bot not configured');
    return;
  }

  try {
    await bot.sendMessage(chatId, message, {
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
    console.log('Telegram alert sent successfully');
  } catch (error) {
    console.error('Failed to send Telegram alert:', error);
    console.error('Bot status:', !!bot, 'Chat ID status:', !!chatId);
    // Don't throw error to prevent breaking the application flow
    throw new Error(`Telegram alert failed: ${error.message}`);
  }
}