import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from '../../categories/entities/category.entity';

export enum SubmissionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum SubmissionSource {
  WEB = 'web',
  BOT = 'bot',
}

@Entity('submissions')
export class Submission {
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

  @Column({ nullable: true })
  subscribersCount: number;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.PENDING,
  })
  status: SubmissionStatus;

  @Column({
    type: 'enum',
    enum: SubmissionSource,
    default: SubmissionSource.WEB,
  })
  source: SubmissionSource;

  @Column('text', { nullable: true })
  rejectionReason: string;

  @ManyToOne(() => User, (user) => user.submissions)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @Column()
  categoryId: string;

  @Column({ nullable: true })
  moderatedById: string;

  @Column({ nullable: true })
  moderatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


