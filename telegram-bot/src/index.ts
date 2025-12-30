import { Bot, Context, InlineKeyboard } from 'grammy';
import { config } from 'dotenv';
import axios from 'axios';
import { BotService } from './services/bot.service';
import { UserStateService } from './services/user-state.service';
import { SubmissionService } from './services/submission.service';
import { ModerationService } from './services/moderation.service';

// Load environment variables
config();

// Check BOT_TOKEN
const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN || BOT_TOKEN === 'your-telegram-bot-token') {
  console.error('❌ ОШИБКА: BOT_TOKEN не установлен в .env файле!');
  console.error('Откройте telegram-bot/.env и установите правильный токен бота.');
  process.exit(1);
}

const API_URL = process.env.API_URL || 'http://localhost:3000/api';

console.log('🤖 Запуск Telegram бота...');
console.log(`API URL: ${API_URL}`);
console.log(`BOT_TOKEN: ${BOT_TOKEN.substring(0, 10)}...`);

const bot = new Bot(BOT_TOKEN);

// Services
const userStateService = new UserStateService();
const submissionService = new SubmissionService(API_URL);
const moderationService = new ModerationService(API_URL);
const botService = new BotService(bot, userStateService, submissionService, moderationService);

// Error handling
bot.catch((err) => {
  console.error('❌ Ошибка бота:', err);
});

// Initialize bot
try {
  botService.initialize();
  console.log('✅ Команды бота инициализированы');
} catch (error) {
  console.error('❌ Ошибка инициализации бота:', error);
  process.exit(1);
}

// Start bot
bot.start()
  .then(() => {
    console.log('✅ Telegram бот успешно запущен!');
    console.log('Отправьте /start боту в Telegram для проверки');
  })
  .catch((error) => {
    console.error('❌ Ошибка запуска бота:', error);
    console.error('Проверьте:');
    console.error('1. Правильность токена в telegram-bot/.env');
    console.error('2. Интернет соединение');
    console.error('3. Доступность Telegram API');
    process.exit(1);
  });


