import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Resource } from './resource.entity';
import { User } from '../../users/entities/user.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  comment: string;

  @Column({ type: 'int' })
  rating: number;

  @ManyToOne(() => Resource, (resource) => resource.reviews)
  @JoinColumn({ name: 'resourceId' })
  resource: Resource;

  @Column()
  resourceId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


