import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Resource } from '../../resources/entities/resource.entity';
import { Submission } from '../../resources/entities/submission.entity';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true, nullable: true })
  username: string;

  @Column({ nullable: true })
  avatar: string;

  @Column('text', { nullable: true })
  bio: string;

  @Column({ nullable: true })
  telegramId: string;

  @Column({ nullable: true })
  telegramUsername: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  resetPasswordToken: string;

  @Column({ nullable: true })
  resetPasswordExpires: Date;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Resource, (resource) => resource.author)
  resources: Resource[];

  @OneToMany(() => Submission, (submission) => submission.author)
  submissions: Submission[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}


