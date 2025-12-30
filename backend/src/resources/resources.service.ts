import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Resource, ResourceSource } from './entities/resource.entity';
import { Submission, SubmissionStatus, SubmissionSource } from './entities/submission.entity';
import { Review } from './entities/review.entity';
import { CategoriesService } from '../categories/categories.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectRepository(Resource)
    private resourcesRepository: Repository<Resource>,
    @InjectRepository(Submission)
    private submissionsRepository: Repository<Submission>,
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    private categoriesService: CategoriesService,
    private usersService: UsersService,
  ) {}

  async findAll(page: number = 1, limit: number = 20, categoryId?: string) {
    const skip = (page - 1) * limit;
    const where = categoryId ? { categoryId, isPublished: true } : { isPublished: true };

    const [resources, total] = await this.resourcesRepository.findAndCount({
      where,
      relations: ['category', 'author'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data: resources,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPaidResources(): Promise<Resource[]> {
    const now = new Date();
    return this.resourcesRepository.find({
      where: {
        isPublished: true,
        isPaid: true,
      },
      relations: ['category', 'author'],
      order: { paidUntil: 'DESC', createdAt: 'DESC' },
    }).then(resources => {
      // Фильтруем ресурсы, у которых не истек срок платного размещения
      return resources.filter(r => !r.paidUntil || r.paidUntil > now);
    });
  }

  async findOne(id: string, includeCategory: boolean = true): Promise<Resource> {
    const relations = ['author', 'reviews', 'reviews.author'];
    if (includeCategory) {
      relations.push('category');
    }
    
    const resource = await this.resourcesRepository.findOne({
      where: { id },
      relations,
    });
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    
    // Increment view count
    await this.resourcesRepository.increment({ id }, 'viewCount', 1);
    resource.viewCount += 1;
    
    return resource;
  }

  async createSubmission(data: {
    title: string;
    description?: string;
    telegramLink: string;
    coverImage?: string;
    categoryId: string;
    authorId: string;
    source: SubmissionSource;
    subscribersCount?: number;
  }): Promise<Submission> {
    // Check if resource already exists
    const existing = await this.resourcesRepository.findOne({
      where: { telegramLink: data.telegramLink },
    });
    if (existing) {
      throw new BadRequestException('Resource with this link already exists');
    }

    const submission = this.submissionsRepository.create({
      ...data,
      status: SubmissionStatus.PENDING,
    });

    return this.submissionsRepository.save(submission);
  }

  async approveSubmission(submissionId: string, moderatorId: string): Promise<Resource> {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
      relations: ['category', 'author'],
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    if (submission.status !== SubmissionStatus.PENDING) {
      throw new BadRequestException('Submission already processed');
    }

    // Create resource from submission
    const resource = this.resourcesRepository.create({
      title: submission.title,
      description: submission.description,
      telegramLink: submission.telegramLink,
      coverImage: submission.coverImage,
      subscribersCount: submission.subscribersCount,
      source: submission.source === SubmissionSource.BOT ? ResourceSource.BOT : ResourceSource.WEB,
      categoryId: submission.categoryId,
      authorId: submission.authorId,
      isPublished: true,
    });

    const savedResource = await this.resourcesRepository.save(resource);

    // Update submission
    submission.status = SubmissionStatus.APPROVED;
    submission.moderatedById = moderatorId;
    submission.moderatedAt = new Date();
    await this.submissionsRepository.save(submission);

    // Increment category count
    await this.categoriesService.incrementResourceCount(submission.categoryId);

    return savedResource;
  }

  async rejectSubmission(
    submissionId: string,
    moderatorId: string,
    reason: string,
  ): Promise<Submission> {
    const submission = await this.submissionsRepository.findOne({
      where: { id: submissionId },
    });

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    submission.status = SubmissionStatus.REJECTED;
    submission.moderatedById = moderatorId;
    submission.moderatedAt = new Date();
    submission.rejectionReason = reason;

    return this.submissionsRepository.save(submission);
  }

  async getSubmissions(status?: SubmissionStatus) {
    const where = status ? { status } : {};
    return this.submissionsRepository.find({
      where,
      relations: ['category', 'author'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserResources(userId: string) {
    return this.resourcesRepository.find({
      where: { authorId: userId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserSubmissions(userId: string) {
    return this.submissionsRepository.find({
      where: { authorId: userId },
      relations: ['category'],
      order: { createdAt: 'DESC' },
    });
  }

  async updatePaidStatus(
    resourceId: string,
    isPaid: boolean,
    paidUntil?: Date,
  ): Promise<Resource> {
    const resource = await this.findOne(resourceId);
    resource.isPaid = isPaid;
    resource.paidUntil = paidUntil || null;
    return this.resourcesRepository.save(resource);
  }

  async purchaseAdSlot(
    userId: string,
    categoryId: string,
    durationDays: number,
  ): Promise<{ success: boolean; message: string; resourceId?: string }> {
    // Проверяем количество свободных слотов (максимум 3 платных ресурса на категорию)
    const paidInCategory = await this.resourcesRepository.find({
      where: {
        categoryId,
        isPaid: true,
      },
    });

    const now = new Date();
    const activePaid = paidInCategory.filter(r => {
      if (!r.paidUntil) return false;
      return r.paidUntil > now;
    });

    // Если есть свободные слоты, создаем платное размещение сразу
    if (activePaid.length < 3) {
      // Пользователь должен сначала создать ресурс через обычную форму
      // Здесь возвращаем информацию о необходимости создать ресурс
      return {
        success: false,
        message: 'Сначала создайте ресурс через форму добавления, затем купите рекламный слот',
      };
    }

    // Если все слоты заняты, пользователь становится в очередь
    // (Логика очереди будет реализована в будущем)
    return {
      success: false,
      message: 'Все рекламные слоты заняты. Ваш ресурс будет размещен по очереди после окончания текущих размещений.',
    };
  }

  async addReview(resourceId: string, authorId: string, comment: string, rating: number) {
    const resource = await this.findOne(resourceId);

    const review = this.reviewsRepository.create({
      resourceId,
      authorId,
      comment,
      rating,
    });

    await this.reviewsRepository.save(review);

    // Recalculate rating
    const reviews = await this.reviewsRepository.find({
      where: { resourceId },
    });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    resource.rating = avgRating;
    resource.reviewCount = reviews.length;
    await this.resourcesRepository.save(resource);

    return review;
  }

  async updateTelegramPublishInfo(
    resourceId: string,
    telegramMessageId: string,
    telegramChannelId: string,
  ) {
    const resource = await this.findOne(resourceId);
    resource.telegramMessageId = telegramMessageId;
    resource.telegramChannelId = telegramChannelId;
    return this.resourcesRepository.save(resource);
  }
}

