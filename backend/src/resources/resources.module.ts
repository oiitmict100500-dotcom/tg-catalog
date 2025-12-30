import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { Resource } from './entities/resource.entity';
import { Submission } from './entities/submission.entity';
import { Review } from './entities/review.entity';
import { CategoriesModule } from '../categories/categories.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Resource, Submission, Review]),
    CategoriesModule,
    UsersModule,
  ],
  controllers: [ResourcesController],
  providers: [ResourcesService],
  exports: [ResourcesService],
})
export class ResourcesModule {}


