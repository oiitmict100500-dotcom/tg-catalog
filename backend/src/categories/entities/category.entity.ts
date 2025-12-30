import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Resource } from '../../resources/entities/resource.entity';

export enum CategoryType {
  CHANNEL = 'channel',
  GROUP = 'group',
  BOT = 'bot',
  STICKER = 'sticker',
  EMOJI = 'emoji',
}

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type: CategoryType;

  @Column({ nullable: true })
  telegramChannelId: string;

  @Column({ nullable: true })
  telegramChannelUsername: string;

  @Column({ default: 0 })
  resourceCount: number;

  @OneToMany(() => Resource, (resource) => resource.category)
  resources: Resource[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


