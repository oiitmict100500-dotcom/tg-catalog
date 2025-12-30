import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface TelegramResourceInfo {
  title: string;
  description: string;
  subscribersCount: number;
  isPublic: boolean;
  type: 'channel' | 'group' | 'bot' | 'sticker' | 'emoji';
}

@Injectable()
export class TelegramParserService {
  async parseTelegramResource(url: string): Promise<TelegramResourceInfo> {
    const result: TelegramResourceInfo = {
      title: '',
      description: '',
      subscribersCount: 0,
      isPublic: false,
      type: 'channel',
    };

    try {
      // Extract username from URL
      const match = url.match(/t\.me\/([^\/]+)/);
      if (!match) {
        throw new Error('Invalid Telegram URL');
      }

      const username = match[1].replace('@', '');

      // Try to parse from t.me page
      try {
        const response = await axios.get(`https://t.me/s/${username}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        const $ = cheerio.load(response.data);
        
        // Try to extract title from meta tags
        const title = $('meta[property="og:title"]').attr('content') ||
                     $('title').text() ||
                     username;
        
        const description = $('meta[property="og:description"]').attr('content') ||
                           $('meta[name="description"]').attr('content') ||
                           '';

        result.title = title.replace(/^Telegram: /, '').trim();
        result.description = description.trim();
        result.isPublic = true;

        // Try to extract subscribers count (if available)
        const subscribersText = $('.tgme_page_extra').text();
        const subscribersMatch = subscribersText.match(/([\d\s]+)\s*(subscribers|members|followers)/i);
        if (subscribersMatch) {
          result.subscribersCount = parseInt(
            subscribersMatch[1].replace(/\s/g, ''),
            10,
          ) || 0;
        }

        // Determine type from URL or content
        if (url.includes('/s/')) {
          result.type = 'channel';
        } else if (url.includes('/c/')) {
          result.type = 'group';
        } else if (url.includes('/bot')) {
          result.type = 'bot';
        } else if (url.includes('/addstickers/')) {
          result.type = 'sticker';
        } else if (url.includes('/addemoji/')) {
          result.type = 'emoji';
        }
      } catch (error) {
        // If parsing fails, use basic info
        result.title = username;
        result.isPublic = false;
      }
    } catch (error) {
      console.error('Error parsing Telegram resource:', error);
      throw error;
    }

    return result;
  }

  async validateTelegramUrl(url: string): Promise<boolean> {
    const telegramUrlPattern = /^https?:\/\/(t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/;
    return telegramUrlPattern.test(url);
  }
}


