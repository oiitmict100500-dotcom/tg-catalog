import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class TelegramService {
  private readonly botToken: string;
  private readonly apiUrl: string;

  constructor(private configService: ConfigService) {
    this.botToken = this.configService.get('TELEGRAM_BOT_TOKEN', '');
    this.apiUrl = this.configService.get('TELEGRAM_API_URL', 'https://api.telegram.org/bot');
  }

  async sendMessage(
    chatId: string | number,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      reply_markup?: any;
      disable_web_page_preview?: boolean;
    },
  ) {
    try {
      const response = await axios.post(
        `${this.apiUrl}${this.botToken}/sendMessage`,
        {
          chat_id: chatId,
          text,
          ...options,
        },
      );
      return response.data.result;
    } catch (error: any) {
      console.error('Telegram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendPhoto(
    chatId: string | number,
    photo: string | Buffer,
    caption?: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      reply_markup?: any;
    },
  ) {
    try {
      // For URL strings, use direct API call
      if (typeof photo === 'string') {
        const payload: any = {
          chat_id: chatId,
          photo: photo,
        };
        if (caption) payload.caption = caption;
        if (options?.parse_mode) payload.parse_mode = options.parse_mode;
        if (options?.reply_markup) payload.reply_markup = options.reply_markup;

        const response = await axios.post(
          `${this.apiUrl}${this.botToken}/sendPhoto`,
          payload,
        );
        return response.data.result;
      } else {
        // For Buffer, use FormData (requires form-data package)
        // For now, throw error - in production, install form-data package
        throw new Error('Buffer photo upload not implemented. Use photo URL instead.');
      }
    } catch (error: any) {
      console.error('Telegram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async editMessage(
    chatId: string | number,
    messageId: number,
    text: string,
    options?: {
      parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2';
      reply_markup?: any;
    },
  ) {
    try {
      const response = await axios.post(
        `${this.apiUrl}${this.botToken}/editMessageText`,
        {
          chat_id: chatId,
          message_id: messageId,
          text,
          ...options,
        },
      );
      return response.data.result;
    } catch (error: any) {
      console.error('Telegram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async pinMessage(chatId: string | number, messageId: number) {
    try {
      const response = await axios.post(
        `${this.apiUrl}${this.botToken}/pinChatMessage`,
        {
          chat_id: chatId,
          message_id: messageId,
        },
      );
      return response.data.result;
    } catch (error: any) {
      console.error('Telegram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async unpinMessage(chatId: string | number, messageId: number) {
    try {
      const response = await axios.post(
        `${this.apiUrl}${this.botToken}/unpinChatMessage`,
        {
          chat_id: chatId,
          message_id: messageId,
        },
      );
      return response.data.result;
    } catch (error: any) {
      console.error('Telegram API error:', error.response?.data || error.message);
      throw error;
    }
  }

  async getChat(chatId: string | number) {
    try {
      const response = await axios.post(
        `${this.apiUrl}${this.botToken}/getChat`,
        {
          chat_id: chatId,
        },
      );
      return response.data.result;
    } catch (error: any) {
      console.error('Telegram API error:', error.response?.data || error.message);
      throw error;
    }
  }
}

