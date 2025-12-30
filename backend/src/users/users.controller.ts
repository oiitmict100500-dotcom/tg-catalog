import { Controller, Get, Post, Body, Param, UseGuards, Request, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Post('telegram')
  async createOrUpdateFromTelegram(@Body() body: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  }) {
    return this.usersService.createOrUpdateFromTelegram(body);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/resources')
  async getMyResources(@Request() req) {
    const userId = req.user.id;
    const resources = await this.usersService.getUserResources(userId);
    const submissions = await this.usersService.getUserSubmissions(userId);
    return [...resources, ...submissions];
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/profile')
  async updateProfile(@Request() req, @Body() body: {
    username?: string;
    avatar?: string;
    bio?: string;
  }) {
    return this.usersService.updateProfile(req.user.id, body);
  }
}
