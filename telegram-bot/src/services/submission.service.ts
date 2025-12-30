import axios from 'axios';

export class SubmissionService {
  constructor(private apiUrl: string) {}

  async createOrGetUser(telegramUser: any) {
    try {
      const response = await axios.post(`${this.apiUrl}/users/telegram`, {
        id: telegramUser.id.toString(),
        username: telegramUser.username,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
      });
      return response.data;
    } catch (error) {
      console.error('Error creating/getting user:', error);
      throw error;
    }
  }

  async parseTelegramResource(url: string) {
    try {
      const response = await axios.post(`${this.apiUrl}/telegram/parse`, {
        url,
      });
      return response.data;
    } catch (error) {
      console.error('Error parsing resource:', error);
      // Fallback to basic parsing
      const match = url.match(/t\.me\/([^\/]+)/);
      return {
        title: match ? match[1] : 'Unknown',
        description: '',
        subscribersCount: 0,
        isPublic: false,
      };
    }
  }

  async createSubmission(data: {
    category: string;
    link: string;
    title: string;
    description?: string;
    coverImage?: string;
    authorId: string;
    subscribersCount?: number;
  }) {
    try {
      // Get category by type
      const categoriesResponse = await axios.get(`${this.apiUrl}/categories`);
      const categories = categoriesResponse.data;
      const category = categories.find((c: any) => c.slug === data.category || c.type === data.category);
      
      if (!category) {
        throw new Error('Category not found');
      }

      const response = await axios.post(`${this.apiUrl}/resources/submit`, {
        title: data.title,
        description: data.description,
        telegramLink: data.link,
        coverImage: data.coverImage,
        categoryId: category.id,
        authorId: data.authorId,
        source: 'bot',
        subscribersCount: data.subscribersCount,
      });

      return response.data;
    } catch (error: any) {
      console.error('Error creating submission:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUserResources(userId: string) {
    try {
      const response = await axios.get(`${this.apiUrl}/resources/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting user resources:', error);
      return [];
    }
  }

  async getUserStats(userId: string) {
    try {
      const resources = await this.getUserResources(userId);
      const published = resources.filter((r: any) => r.isPublished).length;
      const pending = resources.filter((r: any) => !r.isPublished && !r.isRejected).length;
      const rejected = resources.filter((r: any) => r.isRejected).length;
      const totalViews = resources.reduce((sum: number, r: any) => sum + (r.viewCount || 0), 0);
      const avgRating = resources.length > 0
        ? resources.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / resources.length
        : 0;

      return {
        published,
        pending,
        rejected,
        totalViews,
        averageRating: avgRating,
      };
    } catch (error) {
      return {
        published: 0,
        pending: 0,
        rejected: 0,
        totalViews: 0,
        averageRating: 0,
      };
    }
  }

  async checkDailyLimit(userId: string): Promise<boolean> {
    // In production, check from database
    // For now, return true (implement proper limit checking)
    return true;
  }
}


