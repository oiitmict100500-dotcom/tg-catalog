import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Проверяем, существует ли пользователь с таким email
    const existingUserByEmail = await this.usersService.findByEmail(registerDto.email);
    if (existingUserByEmail) {
      throw new BadRequestException('Пользователь с таким email уже существует');
    }

    // Проверяем, существует ли пользователь с таким username
    const existingUserByUsername = await this.usersService.findByUsername(registerDto.username);
    if (existingUserByUsername) {
      throw new BadRequestException('Пользователь с таким логином уже существует');
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Создаем пользователя
    const user = await this.usersService.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
    });

    // Генерируем JWT токен
    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    };
  }

  async login(loginDto: LoginDto) {
    // Ищем пользователя по email или username
    let user: User | null = null;
    
    if (loginDto.login.includes('@')) {
      user = await this.usersService.findByEmail(loginDto.login);
    } else {
      user = await this.usersService.findByUsername(loginDto.login);
    }

    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    // Генерируем JWT токен
    const token = this.jwtService.sign({ userId: user.id, email: user.email });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
    };
  }

  async validateUser(userId: string): Promise<User> {
    const user = await this.usersService.findById(userId);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Пользователь не найден или заблокирован');
    }
    return user;
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(forgotPasswordDto.email);
    
    if (!user) {
      // Не раскрываем информацию о существовании пользователя
      return { message: 'Если аккаунт с таким email существует, письмо отправлено' };
    }

    // Генерируем токен сброса пароля
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Токен действует 1 час

    await this.usersService.updateResetPasswordToken(user.id, resetToken, resetExpires);

    // TODO: Отправить email с токеном сброса пароля
    // В реальном приложении здесь должен быть вызов сервиса отправки email
    console.log(`Reset password token for ${user.email}: ${resetToken}`);

    return { message: 'Если аккаунт с таким email существует, письмо отправлено' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(resetPasswordDto.token);
    
    if (!user || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Недействительный или истекший токен сброса пароля');
    }

    // Хешируем новый пароль
    const hashedPassword = await bcrypt.hash(resetPasswordDto.password, 10);

    // Обновляем пароль и очищаем токен
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Пароль успешно изменен' };
  }

  async verifyTelegramAuth(telegramAuth: TelegramAuthDto, botToken: string): Promise<boolean> {
    try {
      // Проверяем, что данные не старше 24 часов
      const authDate = new Date(telegramAuth.auth_date * 1000);
      const now = new Date();
      const diff = now.getTime() - authDate.getTime();
      if (diff > 24 * 60 * 60 * 1000) {
        console.error('Telegram auth data expired:', diff / 1000 / 60, 'minutes ago');
        return false;
      }

      // Формируем объект с данными для проверки (исключая hash)
      // Важно: включаем только непустые поля (не null, не undefined, не пустая строка)
      const dataToCheck: Record<string, string | number> = {};
      
      // Обязательные поля
      dataToCheck['auth_date'] = telegramAuth.auth_date;
      dataToCheck['first_name'] = telegramAuth.first_name;
      dataToCheck['id'] = telegramAuth.id;
      
      // Опциональные поля (только если они не пустые)
      if (telegramAuth.last_name && telegramAuth.last_name.trim() !== '') {
        dataToCheck['last_name'] = telegramAuth.last_name;
      }
      
      if (telegramAuth.photo_url && telegramAuth.photo_url.trim() !== '') {
        dataToCheck['photo_url'] = telegramAuth.photo_url;
      }
      
      if (telegramAuth.username && telegramAuth.username.trim() !== '') {
        dataToCheck['username'] = telegramAuth.username;
      }

      // Формируем строку для проверки: сортируем ключи по алфавиту
      const sortedKeys = Object.keys(dataToCheck).sort();
      const dataCheckString = sortedKeys
        .map(key => `${key}=${dataToCheck[key]}`)
        .join('\n');

      // Создаем секретный ключ из bot token
      const secretKey = crypto
        .createHash('sha256')
        .update(botToken)
        .digest();

      // Вычисляем HMAC-SHA256
      const hmac = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Логируем для отладки (только в dev режиме)
      if (process.env.NODE_ENV !== 'production') {
        console.log('Telegram auth verification:', {
          dataCheckString,
          receivedHash: telegramAuth.hash,
          calculatedHash: hmac,
          match: hmac === telegramAuth.hash,
          botTokenLength: botToken?.length || 0,
        });
      }

      // Сравниваем хеши (без учета регистра)
      return hmac.toLowerCase() === telegramAuth.hash.toLowerCase();
    } catch (error) {
      console.error('Error verifying Telegram auth:', error);
      return false;
    }
  }

  async loginWithTelegram(telegramAuth: TelegramAuthDto): Promise<{ user: any; token: string }> {
    console.log('🔐 loginWithTelegram called with:', {
      id: telegramAuth.id,
      username: telegramAuth.username,
      first_name: telegramAuth.first_name,
      hasHash: !!telegramAuth.hash,
      auth_date: new Date(telegramAuth.auth_date * 1000).toISOString(),
    });

    const botToken = process.env.TELEGRAM_BOT_TOKEN || process.env.BOT_TOKEN;
    
    if (!botToken) {
      console.error('❌ Telegram bot token not configured');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('TELEGRAM') || k.includes('BOT')));
      throw new BadRequestException('Telegram bot token не настроен. Проверьте переменные окружения TELEGRAM_BOT_TOKEN или BOT_TOKEN');
    }

    console.log('✅ Bot token found, length:', botToken.length);

    // Проверяем подлинность данных Telegram
    const isValid = await this.verifyTelegramAuth(telegramAuth, botToken);
    if (!isValid) {
      console.error('❌ Telegram auth verification failed', {
        userId: telegramAuth.id,
        username: telegramAuth.username,
        authDate: new Date(telegramAuth.auth_date * 1000).toISOString(),
      });
      throw new UnauthorizedException('Неверные данные авторизации Telegram. Проверьте настройки домена в BotFather и правильность токена бота.');
    }

    console.log('✅ Telegram auth verified successfully');

    // Ищем или создаем пользователя
    let user = await this.usersService.findByTelegramId(telegramAuth.id.toString());

    if (!user) {
      console.log('👤 Creating new user for Telegram ID:', telegramAuth.id);
      // Создаем нового пользователя
      const fullName = `${telegramAuth.first_name}${telegramAuth.last_name ? ' ' + telegramAuth.last_name : ''}`;
      user = await this.usersService.create({
        telegramId: telegramAuth.id.toString(),
        username: telegramAuth.username || `user_${telegramAuth.id}`,
        email: null,
        password: null,
        avatar: telegramAuth.photo_url || null,
        bio: null,
      });
      console.log('✅ New user created:', user.id, user.username);
    } else {
      console.log('👤 Updating existing user:', user.id, user.username);
      // Обновляем данные пользователя
      if (telegramAuth.username && user.username !== telegramAuth.username) {
        user.username = telegramAuth.username;
      }
      if (telegramAuth.photo_url && user.avatar !== telegramAuth.photo_url) {
        user.avatar = telegramAuth.photo_url;
      }
      await this.usersService.update(user.id, user);
      console.log('✅ User updated');
    }

    // Генерируем JWT токен
    const token = await this.generateJwtToken(user);
    console.log('✅ JWT token generated');

    // Формируем ответ в правильном формате
    const response = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
      },
      token: token,
    };

    console.log('✅ Returning auth response for user:', response.user.username);
    return response;
  }

  async generateJwtToken(user: any): Promise<string> {
    const payload = { id: user.id, email: user.email, username: user.username, telegramId: user.telegramId };
    return this.jwtService.sign(payload);
  }
}

