import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../telegram/telegram.service';
import { ResourcesService } from '../resources/resources.service';
import { CategoriesService } from '../categories/categories.service';
import { Resource } from '../resources/entities/resource.entity';
import { CategoryType } from '../categories/entities/category.entity';

@Injectable()
export class ChannelPosterService {
  private readonly channels: Record<CategoryType, string>;

  constructor(
    private configService: ConfigService,
    private telegramService: TelegramService,
    private resourcesService: ResourcesService,
    private categoriesService: CategoriesService,
  ) {
    this.channels = {
      [CategoryType.CHANNEL]: this.configService.get('CHANNEL_CHANNELS_ID', ''),
      [CategoryType.GROUP]: this.configService.get('CHANNEL_GROUPS_ID', ''),
      [CategoryType.BOT]: this.configService.get('CHANNEL_BOTS_ID', ''),
      [CategoryType.STICKER]: this.configService.get('CHANNEL_STICKERS_ID', ''),
      [CategoryType.EMOJI]: this.configService.get('CHANNEL_EMOJI_ID', ''),
    };
  }

  private getCategoryIcon(type: CategoryType): string {
    const icons = {
      [CategoryType.CHANNEL]: '📢',
      [CategoryType.GROUP]: '👥',
      [CategoryType.BOT]: '🤖',
      [CategoryType.STICKER]: '😄',
      [CategoryType.EMOJI]: '🎭',
    };
    return icons[type] || '📌';
  }

  private formatMessage(resource: Resource, categoryType: CategoryType): string {
    const icon = this.getCategoryIcon(categoryType);
    const siteUrl = this.configService.get('SITE_URL', 'http://localhost:3000');
    const resourceUrl = `${siteUrl}/resource/${resource.id}`;
    
    let description = resource.description || '';
    if (description.length > 200) {
      description = description.substring(0, 200) + '...';
    }

    const ratingText = resource.rating > 0
      ? `⭐ Рейтинг: <b>${resource.rating.toFixed(1)}</b>/5\n`
      : '';

    return `${icon} <b>${this.escapeHtml(resource.title)}</b>

${description ? this.escapeHtml(description) + '\n' : ''}
👁️ Просмотров на сайте: <b>${resource.viewCount}</b>
${ratingText}
🔗 Перейти: ${resource.telegramLink}

📌 Добавить в каталог: @tgcatalog_bot

#${categoryType} #telegram #каталог`.trim();
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async publishToChannel(resource: Resource): Promise<void> {
    // Get category from resource (should be loaded with relation)
    let category;
    if (resource.category) {
      category = resource.category;
    } else {
      // Fallback: get category by ID
      const categories = await this.categoriesService.findAll();
      category = categories.find(c => c.id === resource.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
    }
    
    const channelId = this.channels[category.type];

    if (!channelId) {
      throw new Error(`Channel not configured for category type: ${category.type}`);
    }

    const message = this.formatMessage(resource, category.type);
    const siteUrl = this.configService.get('SITE_URL', 'http://localhost:3000');
    const resourceUrl = `${siteUrl}/resource/${resource.id}`;

    const replyMarkup = {
      inline_keyboard: [
        [
          {
            text: '🔗 Перейти к ресурсу',
            url: resource.telegramLink,
          },
        ],
        [
          {
            text: '📊 Статистика на сайте',
            url: resourceUrl,
          },
        ],
      ],
    };

    let sentMessage;
    if (resource.coverImage) {
      sentMessage = await this.telegramService.sendPhoto(
        channelId,
        resource.coverImage,
        message,
        {
          parse_mode: 'HTML',
          reply_markup: replyMarkup,
        },
      );
    } else {
      sentMessage = await this.telegramService.sendMessage(channelId, message, {
        parse_mode: 'HTML',
        reply_markup: replyMarkup,
      });
    }

    // Save message ID to resource
    await this.resourcesService.updateTelegramPublishInfo(
      resource.id,
      sentMessage.message_id.toString(),
      channelId,
    );
  }

  async updateChannelPost(resource: Resource): Promise<void> {
    if (!resource.telegramMessageId || !resource.telegramChannelId) {
      throw new Error('Resource not published to channel');
    }

    // Get category from resource
    let category;
    if (resource.category) {
      category = resource.category;
    } else {
      const categories = await this.categoriesService.findAll();
      category = categories.find(c => c.id === resource.categoryId);
      if (!category) {
        throw new Error('Category not found');
      }
    }
    
    const message = this.formatMessage(resource, category.type);

    await this.telegramService.editMessage(
      resource.telegramChannelId,
      parseInt(resource.telegramMessageId),
      message,
      {
        parse_mode: 'HTML',
      },
    );
  }

  async pinPost(resource: Resource, hours: number = 24): Promise<void> {
    if (!resource.telegramMessageId || !resource.telegramChannelId) {
      throw new Error('Resource not published to channel');
    }

    await this.telegramService.pinMessage(
      resource.telegramChannelId,
      parseInt(resource.telegramMessageId),
    );

    // Update resource
    const pinnedUntil = new Date();
    pinnedUntil.setHours(pinnedUntil.getHours() + hours);
    resource.isPinned = true;
    resource.pinnedUntil = pinnedUntil;
  }
}

