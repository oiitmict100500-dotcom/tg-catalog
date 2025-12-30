import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdatePaidDto } from './dto/update-paid.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('category') categoryId?: string,
  ) {
    return this.resourcesService.findAll(
      parseInt(page),
      parseInt(limit),
      categoryId,
    );
  }

  @Get('paid')
  async getPaidResources() {
    return this.resourcesService.findPaidResources();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Get('user/:userId')
  async getUserResources(@Param('userId') userId: string) {
    const resources = await this.resourcesService.getUserResources(userId);
    const submissions = await this.resourcesService.getUserSubmissions(userId);
    return [...resources, ...submissions];
  }

  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async createSubmission(@Body() createSubmissionDto: CreateSubmissionDto, @Request() req) {
    // Автоматически добавляем authorId из токена
    return this.resourcesService.createSubmission({
      ...createSubmissionDto,
      authorId: req.user.id,
    });
  }

  @Post(':id/reviews')
  async addReview(
    @Param('id') id: string,
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: any,
  ) {
    return this.resourcesService.addReview(
      id,
      req.user?.id || 'anonymous',
      createReviewDto.comment,
      createReviewDto.rating,
    );
  }

      @UseGuards(JwtAuthGuard)
      @Post(':id/paid')
      async setPaidStatus(
        @Param('id') id: string,
        @Body() body: { isPaid: boolean; paidUntil?: string },
        @Request() req: any,
      ) {
        // TODO: Проверить права администратора
        // if (req.user.role !== 'admin') {
        //   throw new ForbiddenException('Только администраторы могут управлять платными размещениями');
        // }
        
        return this.resourcesService.updatePaidStatus(
          id,
          body.isPaid,
          body.paidUntil ? new Date(body.paidUntil) : undefined,
        );
      }

      @UseGuards(JwtAuthGuard)
      @Post('purchase-ad-slot')
      async purchaseAdSlot(
        @Body() body: { categoryId: string; durationDays: number },
        @Request() req: any,
      ) {
        return this.resourcesService.purchaseAdSlot(
          req.user.id,
          body.categoryId,
          body.durationDays,
        );
      }
}
