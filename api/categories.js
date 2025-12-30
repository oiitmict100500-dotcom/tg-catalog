// Простой API endpoint для категорий (без базы данных)
// Vercel Serverless Function
export default function handler(req, res) {
  // Устанавливаем CORS заголовки
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Статический список категорий с подкатегориями
  const categories = [
    {
      id: '1',
      slug: 'channels',
      name: 'Каналы',
      description: 'Telegram каналы',
      type: 'channel',
      resourceCount: 0,
      subcategories: [
        { id: '1-1', name: 'Новости', slug: 'news' },
        { id: '1-2', name: 'IT и технологии', slug: 'it-tech' },
        { id: '1-3', name: 'Мемы и юмор', slug: 'memes' },
        { id: '1-4', name: 'Образование', slug: 'education' },
        { id: '1-5', name: 'Бизнес', slug: 'business' },
        { id: '1-6', name: 'Спорт', slug: 'sport' },
        { id: '1-7', name: 'Развлечения', slug: 'entertainment' },
        { id: '1-8', name: 'Другое', slug: 'other' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      slug: 'groups',
      name: 'Группы',
      description: 'Telegram группы',
      type: 'group',
      resourceCount: 0,
      subcategories: [
        { id: '2-1', name: 'Новости', slug: 'news' },
        { id: '2-2', name: 'IT и технологии', slug: 'it-tech' },
        { id: '2-3', name: 'Мемы и юмор', slug: 'memes' },
        { id: '2-4', name: 'Образование', slug: 'education' },
        { id: '2-5', name: 'Бизнес', slug: 'business' },
        { id: '2-6', name: 'Спорт', slug: 'sport' },
        { id: '2-7', name: 'Развлечения', slug: 'entertainment' },
        { id: '2-8', name: 'Другое', slug: 'other' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      slug: 'bots',
      name: 'Боты',
      description: 'Telegram боты',
      type: 'bot',
      resourceCount: 0,
      subcategories: [
        { id: '3-1', name: 'Утилиты', slug: 'utilities' },
        { id: '3-2', name: 'Развлечения', slug: 'entertainment' },
        { id: '3-3', name: 'Образование', slug: 'education' },
        { id: '3-4', name: 'Бизнес', slug: 'business' },
        { id: '3-5', name: 'Игры', slug: 'games' },
        { id: '3-6', name: 'Музыка', slug: 'music' },
        { id: '3-7', name: 'Другое', slug: 'other' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '4',
      slug: 'stickers',
      name: 'Стикеры',
      description: 'Стикерпаки',
      type: 'sticker',
      resourceCount: 0,
      subcategories: [
        { id: '4-1', name: 'Мемы', slug: 'memes' },
        { id: '4-2', name: 'Эмоции', slug: 'emotions' },
        { id: '4-3', name: 'Животные', slug: 'animals' },
        { id: '4-4', name: 'Аниме', slug: 'anime' },
        { id: '4-5', name: 'Игры', slug: 'games' },
        { id: '4-6', name: 'Другое', slug: 'other' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '5',
      slug: 'emoji',
      name: 'Эмодзи',
      description: 'Эмодзипаки',
      type: 'emoji',
      resourceCount: 0,
      subcategories: [
        { id: '5-1', name: 'Эмоции', slug: 'emotions' },
        { id: '5-2', name: 'Животные', slug: 'animals' },
        { id: '5-3', name: 'Еда', slug: 'food' },
        { id: '5-4', name: 'Спорт', slug: 'sport' },
        { id: '5-5', name: 'Другое', slug: 'other' },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return res.status(200).json(categories);
}

