// Простой API endpoint для категорий (без базы данных)
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

  // Статический список категорий
  const categories = [
    {
      id: '1',
      slug: 'channels',
      name: 'Каналы',
      description: 'Telegram каналы',
      type: 'channel',
      resourceCount: 0,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  return res.status(200).json(categories);
}

