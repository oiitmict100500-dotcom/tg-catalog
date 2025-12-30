import { DataSource } from 'typeorm';
import { Category, CategoryType } from '../categories/entities/category.entity';

export async function initCategories(dataSource: DataSource) {
  const categoryRepository = dataSource.getRepository(Category);

  const categories = [
    {
      slug: 'channels',
      name: 'Каналы',
      description: 'Публичные Telegram-каналы',
      type: CategoryType.CHANNEL,
      telegramChannelUsername: 'tgcatalog_channels',
    },
    {
      slug: 'groups',
      name: 'Группы',
      description: 'Telegram-группы и чаты',
      type: CategoryType.GROUP,
      telegramChannelUsername: 'tgcatalog_groups',
    },
    {
      slug: 'bots',
      name: 'Боты',
      description: 'Telegram-боты',
      type: CategoryType.BOT,
      telegramChannelUsername: 'tgcatalog_bots',
    },
    {
      slug: 'stickers',
      name: 'Стикерпаки',
      description: 'Наборы стикеров для Telegram',
      type: CategoryType.STICKER,
      telegramChannelUsername: 'tgcatalog_stickers',
    },
    {
      slug: 'emoji',
      name: 'Эмодзи-паки',
      description: 'Наборы эмодзи для Telegram',
      type: CategoryType.EMOJI,
      telegramChannelUsername: 'tgcatalog_emoji',
    },
  ];

  for (const categoryData of categories) {
    const existing = await categoryRepository.findOne({
      where: { slug: categoryData.slug },
    });

    if (!existing) {
      const category = categoryRepository.create(categoryData);
      await categoryRepository.save(category);
      // Убрали логирование - категории создаются автоматически при первом запуске
    }
    // Убрали логирование существующих категорий - это нормально
  }
}


