import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category, CategoryType } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoriesRepository: Repository<Category>,
  ) {}

  async findAll(): Promise<Category[]> {
    return this.categoriesRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { slug },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async findByType(type: CategoryType): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { type },
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  async incrementResourceCount(categoryId: string): Promise<void> {
    await this.categoriesRepository.increment({ id: categoryId }, 'resourceCount', 1);
  }
}


