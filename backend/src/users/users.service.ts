import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { Resource } from '../resources/entities/resource.entity';
import { Submission } from '../resources/entities/submission.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByTelegramId(telegramId: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { telegramId },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { resetPasswordToken: token },
    });
  }

  async create(userData: Partial<User> & { 
    password?: string;
  }): Promise<User> {
    const user = this.usersRepository.create(userData);
    
    // Хешируем пароль только если он указан (для обычной регистрации)
    if (userData.password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(userData.password, salt);
    }
    
    return this.usersRepository.save(user);
  }

  async update(userId: string, userData: Partial<User>): Promise<User> {
    const user = await this.findById(userId);
    Object.assign(user, userData);
    return this.usersRepository.save(user);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<User> {
    const user = await this.findById(userId);
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    return this.usersRepository.save(user);
  }

  async updateResetPasswordToken(
    userId: string,
    token: string,
    expires: Date,
  ): Promise<User> {
    const user = await this.findById(userId);
    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;
    return this.usersRepository.save(user);
  }

  async updateProfile(
    userId: string,
    updateData: {
      username?: string;
      avatar?: string;
      bio?: string;
    },
  ): Promise<User> {
    const user = await this.findById(userId);
    
    if (updateData.username && updateData.username !== user.username) {
      const existingUser = await this.findByUsername(updateData.username);
      if (existingUser && existingUser.id !== userId) {
        throw new BadRequestException('Пользователь с таким логином уже существует');
      }
      user.username = updateData.username;
    }
    
    if (updateData.avatar !== undefined) {
      user.avatar = updateData.avatar;
    }
    
    if (updateData.bio !== undefined) {
      user.bio = updateData.bio;
    }
    
    return this.usersRepository.save(user);
  }

  async createOrUpdateFromTelegram(telegramData: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }): Promise<User> {
    let user = await this.findByTelegramId(telegramData.id.toString());
    
    if (!user) {
      user = this.usersRepository.create({
        telegramId: telegramData.id.toString(),
        telegramUsername: telegramData.username,
        firstName: telegramData.first_name,
        lastName: telegramData.last_name,
      });
    } else {
      user.telegramUsername = telegramData.username || user.telegramUsername;
      user.firstName = telegramData.first_name || user.firstName;
      user.lastName = telegramData.last_name || user.lastName;
    }

    return this.usersRepository.save(user);
  }

  async updateRole(userId: string, role: UserRole): Promise<User> {
    const user = await this.findById(userId);
    user.role = role;
    return this.usersRepository.save(user);
  }

  async getUserResources(userId: string): Promise<any[]> {
    // Используем QueryBuilder для правильной загрузки ресурсов
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.resources', 'resource')
      .leftJoinAndSelect('resource.category', 'category')
      .where('user.id = :userId', { userId })
      .getOne();
    
    return user?.resources?.filter((r: any) => r.isPublished) || [];
  }

  async getUserSubmissions(userId: string): Promise<any[]> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.submissions', 'submission')
      .leftJoinAndSelect('submission.category', 'category')
      .where('user.id = :userId', { userId })
      .getOne();
    
    return user?.submissions || [];
  }
}


