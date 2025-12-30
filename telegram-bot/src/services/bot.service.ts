import { Bot, Context, InlineKeyboard } from 'grammy';
import { UserStateService } from './user-state.service';
import { SubmissionService } from './submission.service';
import { ModerationService } from './moderation.service';

export enum UserState {
  IDLE = 'idle',
  WAITING_CATEGORY = 'waiting_category',
  WAITING_LINK = 'waiting_link',
  WAITING_TITLE = 'waiting_title',
  WAITING_DESCRIPTION = 'waiting_description',
  WAITING_COVER = 'waiting_cover',
}

export class BotService {
  constructor(
    private bot: Bot,
    private userStateService: UserStateService,
    private submissionService: SubmissionService,
    private moderationService: ModerationService,
  ) {}

  initialize() {
    // Start command
    this.bot.command('start', async (ctx) => {
      await ctx.reply(
        '👋 Добро пожаловать в TG Catalog!\n\n' +
        'Я помогу вам добавить ваш Telegram-ресурс в каталог.\n\n' +
        'Доступные команды:\n' +
        '/add - Добавить ресурс\n' +
        '/my_resources - Мои ресурсы\n' +
        '/stats - Статистика\n' +
        '/help - Помощь',
      );
    });

    // Add resource command
    this.bot.command('add', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      // Check daily limit
      const canSubmit = await this.submissionService.checkDailyLimit(userId);
      if (!canSubmit) {
        await ctx.reply(
          '❌ Вы достигли дневного лимита на добавление ресурсов (3 в день).\n' +
          'Попробуйте завтра или используйте веб-сайт.',
        );
        return;
      }

      // Create or get user
      await this.submissionService.createOrGetUser(ctx.from);

      const keyboard = new InlineKeyboard()
        .text('📢 Канал', 'category_channel')
        .text('👥 Группа', 'category_group')
        .row()
        .text('🤖 Бот', 'category_bot')
        .text('😄 Стикеры', 'category_sticker')
        .text('🎭 Эмодзи', 'category_emoji');

      await ctx.reply('Выберите категорию ресурса:', {
        reply_markup: keyboard,
      });

      this.userStateService.setState(userId, UserState.WAITING_CATEGORY);
    });

    // My resources command
    this.bot.command('my_resources', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const resources = await this.submissionService.getUserResources(userId);
      
      if (resources.length === 0) {
        await ctx.reply('У вас пока нет добавленных ресурсов.\nИспользуйте /add для добавления.');
        return;
      }

      let message = '📋 Ваши ресурсы:\n\n';
      for (const resource of resources.slice(0, 10)) {
        const status = resource.isPublished ? '✅ Опубликован' : '⏳ На модерации';
        message += `${status} - ${resource.title}\n`;
        message += `🔗 ${resource.telegramLink}\n\n`;
      }

      await ctx.reply(message);
    });

    // Stats command
    this.bot.command('stats', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const stats = await this.submissionService.getUserStats(userId);
      
      const message = `📊 Ваша статистика:\n\n` +
        `✅ Опубликовано: ${stats.published}\n` +
        `⏳ На модерации: ${stats.pending}\n` +
        `❌ Отклонено: ${stats.rejected}\n` +
        `👁️ Всего просмотров: ${stats.totalViews}\n` +
        `⭐ Средний рейтинг: ${stats.averageRating.toFixed(1)}`;

      await ctx.reply(message);
    });

    // Help command
    this.bot.command('help', async (ctx) => {
      await ctx.reply(
        '📖 Помощь по использованию бота:\n\n' +
        '/add - Добавить новый ресурс в каталог\n' +
        '/my_resources - Посмотреть ваши ресурсы\n' +
        '/stats - Статистика по вашим ресурсам\n\n' +
        'Процесс добавления:\n' +
        '1. Выберите категорию\n' +
        '2. Отправьте ссылку на ресурс\n' +
        '3. Подтвердите или отредактируйте название\n' +
        '4. Добавьте описание (опционально)\n' +
        '5. Загрузите обложку (опционально)\n\n' +
        'После модерации вы получите уведомление!',
      );
    });

    // Category selection
    this.bot.callbackQuery(/^category_(.+)$/, async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const categoryType = ctx.match[1];
      const categoryMap: Record<string, string> = {
        channel: 'channel',
        group: 'group',
        bot: 'bot',
        sticker: 'sticker',
        emoji: 'emoji',
      };

      const categorySlug = categoryMap[categoryType];
      if (!categorySlug) {
        await ctx.answerCallbackQuery('Неизвестная категория');
        return;
      }

      this.userStateService.setCategory(userId, categorySlug);
      this.userStateService.setState(userId, UserState.WAITING_LINK);

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        'Отправьте ссылку на ваш Telegram-ресурс:\n\n' +
        'Примеры:\n' +
        '• https://t.me/channelname\n' +
        '• https://t.me/joinchat/xxxxx\n' +
        '• https://t.me/botname',
      );
    });

    // Handle URL messages
    this.bot.on('message::url', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const state = this.userStateService.getState(userId);
      if (state !== UserState.WAITING_LINK) return;

      const url = ctx.message.text;
      
      // Validate URL
      if (!url.includes('t.me/') && !url.includes('telegram.me/')) {
        await ctx.reply('❌ Пожалуйста, отправьте корректную ссылку на Telegram-ресурс.');
        return;
      }

      try {
        // Parse resource info
        const resourceInfo = await this.submissionService.parseTelegramResource(url);
        
        // Save to state
        this.userStateService.setLink(userId, url);
        this.userStateService.setTitle(userId, resourceInfo.title);
        this.userStateService.setDescription(userId, resourceInfo.description || '');

        // Ask for title confirmation
        const keyboard = new InlineKeyboard()
          .text('✅ Подтвердить', 'confirm_title')
          .text('✏️ Редактировать', 'edit_title');

        await ctx.reply(
          `📝 Название ресурса:\n\n` +
          `<b>${resourceInfo.title}</b>\n\n` +
          `Подтвердите или отредактируйте:`,
          {
            parse_mode: 'HTML',
            reply_markup: keyboard,
          },
        );

        this.userStateService.setState(userId, UserState.WAITING_TITLE);
      } catch (error) {
        console.error('Error parsing resource:', error);
        await ctx.reply(
          '❌ Не удалось обработать ссылку. Проверьте правильность ссылки и попробуйте снова.',
        );
      }
    });

    // Handle text messages (for title/description editing)
    this.bot.on('message:text', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const state = this.userStateService.getState(userId);
      const text = ctx.message.text;

      if (state === UserState.WAITING_TITLE) {
        this.userStateService.setTitle(userId, text);
        
        const keyboard = new InlineKeyboard()
          .text('✅ Продолжить', 'continue_description')
          .text('⏭️ Пропустить описание', 'skip_description');

        await ctx.reply(
          'Название сохранено!\n\nТеперь добавьте описание (или пропустите):',
          { reply_markup: keyboard },
        );
        
        this.userStateService.setState(userId, UserState.WAITING_DESCRIPTION);
      } else if (state === UserState.WAITING_DESCRIPTION) {
        this.userStateService.setDescription(userId, text);
        
        const keyboard = new InlineKeyboard()
          .text('📷 Добавить обложку', 'add_cover')
          .text('⏭️ Пропустить', 'skip_cover');

        await ctx.reply(
          'Описание сохранено!\n\nДобавьте обложку (или пропустите):',
          { reply_markup: keyboard },
        );
        
        this.userStateService.setState(userId, UserState.WAITING_COVER);
      }
    });

    // Handle photo messages
    this.bot.on('message:photo', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const state = this.userStateService.getState(userId);
      if (state !== UserState.WAITING_COVER) return;

      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const file = await ctx.api.getFile(photo.file_id);
      const botToken = process.env.BOT_TOKEN || '';
      const fileUrl = `https://api.telegram.org/file/bot${botToken}/${file.file_path}`;

      this.userStateService.setCoverImage(userId, fileUrl);

      await this.submitResource(ctx, userId);
    });

    // Callback queries
    this.bot.callbackQuery('confirm_title', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const keyboard = new InlineKeyboard()
        .text('✅ Продолжить', 'continue_description')
        .text('⏭️ Пропустить описание', 'skip_description');

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        'Название подтверждено!\n\nДобавьте описание (или пропустите):',
        { reply_markup: keyboard },
      );

      this.userStateService.setState(userId, UserState.WAITING_DESCRIPTION);
    });

    this.bot.callbackQuery('edit_title', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      await ctx.answerCallbackQuery();
      await ctx.editMessageText('Отправьте новое название:');
    });

    this.bot.callbackQuery('skip_description', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      const keyboard = new InlineKeyboard()
        .text('📷 Добавить обложку', 'add_cover')
        .text('⏭️ Пропустить', 'skip_cover');

      await ctx.answerCallbackQuery();
      await ctx.editMessageText(
        'Описание пропущено.\n\nДобавьте обложку (или пропустите):',
        { reply_markup: keyboard },
      );

      this.userStateService.setState(userId, UserState.WAITING_COVER);
    });

    this.bot.callbackQuery('skip_cover', async (ctx) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return;

      await ctx.answerCallbackQuery();
      await this.submitResource(ctx, userId);
    });

    // Moderation callbacks (for moderators)
    this.bot.callbackQuery(/^approve_(.+)$/, async (ctx) => {
      const submissionId = ctx.match[1];
      const moderatorId = ctx.from?.id.toString();
      
      if (!moderatorId) return;

      try {
        await this.moderationService.approveSubmission(submissionId, moderatorId);
        await ctx.answerCallbackQuery('✅ Заявка одобрена');
        await ctx.editMessageText('✅ Заявка одобрена и опубликована!');
      } catch (error) {
        await ctx.answerCallbackQuery('❌ Ошибка при одобрении');
      }
    });

    this.bot.callbackQuery(/^reject_(.+)$/, async (ctx) => {
      const submissionId = ctx.match[1];
      // In real implementation, ask for reason
      await ctx.answerCallbackQuery('Функция отклонения в разработке');
    });
  }

  private async submitResource(ctx: Context, userId: string) {
    try {
      const state = this.userStateService.getState(userId);
      if (state !== UserState.WAITING_COVER) {
        const keyboard = new InlineKeyboard()
          .text('📷 Добавить обложку', 'add_cover')
          .text('⏭️ Пропустить', 'skip_cover');
        
        await ctx.reply(
          'Добавьте обложку или пропустите:',
          { reply_markup: keyboard },
        );
        return;
      }

      const data = this.userStateService.getSubmissionData(userId);
      
      if (!data.category || !data.link || !data.title) {
        await ctx.reply('❌ Ошибка: не все данные заполнены. Начните заново с /add');
        this.userStateService.clearState(userId);
        return;
      }

      // Create submission
      const submission = await this.submissionService.createSubmission({
        ...data,
        authorId: userId,
      });

      await ctx.reply(
        '✅ Заявка отправлена на модерацию!\n\n' +
        'Вы получите уведомление, когда модератор проверит вашу заявку.',
      );

      // Notify moderators
      await this.notifyModerators(submission);

      // Clear state
      this.userStateService.clearState(userId);
    } catch (error) {
      console.error('Error submitting resource:', error);
      await ctx.reply('❌ Произошла ошибка при отправке заявки. Попробуйте позже.');
    }
  }

  private async notifyModerators(submission: any) {
    const moderatorsChatId = process.env.MODERATORS_CHAT_ID;
    if (!moderatorsChatId) return;

    const keyboard = new InlineKeyboard()
      .text('✅ Принять', `approve_${submission.id}`)
      .text('❌ Отклонить', `reject_${submission.id}`)
      .row()
      .text('👀 Посмотреть на сайте', `view_${submission.id}_web`);

    await this.bot.api.sendMessage(
      moderatorsChatId,
      `🔔 Новая заявка на модерацию!\n\n` +
      `Категория: ${submission.category}\n` +
      `Название: ${submission.title}\n` +
      `Ссылка: ${submission.telegramLink}\n` +
      `Автор: @${submission.author?.telegramUsername || 'unknown'}`,
      { reply_markup: keyboard },
    );
  }
}


