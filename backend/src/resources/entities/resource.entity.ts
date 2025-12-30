import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';
import { Review } from './review.entity';

export enum ResourceSource {
  WEB = 'web',
  BOT = 'bot',
}

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text', { nullable: true })
  description: string;

  @Column()
  telegramLink: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  rating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ nullable: true })
  subscribersCount: number;

  @Column({
    type: 'enum',
    enum: ResourceSource,
    default: ResourceSource.WEB,
  })
  source: ResourceSource;

  @Column({ nullable: true })
  telegramMessageId: string;

  @Column({ nullable: true })
  telegramChannelId: string;

  @Column({ default: false })
  autoPublishToTg: boolean;

  @Column({ default: false })
  isPublished: boolean;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ nullable: true })
  pinnedUntil: Date;

  @Column({ default: false })
  isPaid: boolean;

  @Column({ nullable: true })
  paidUntil: Date;

  @ManyToOne(() => User, (user) => user.resources)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Category, (category) => category.resources)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @OneToMany(() => Review, (review) => review.resource)
  reviews: Review[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


