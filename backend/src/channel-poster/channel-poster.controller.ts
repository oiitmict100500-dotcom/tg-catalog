import { Controller, Post, Param, Body } from '@nestjs/common';
import { ChannelPosterService } from './channel-poster.service';
import { ResourcesService } from '../resources/resources.service';

@Controller('channel-poster')
export class ChannelPosterController {
  constructor(
    private readonly channelPosterService: ChannelPosterService,
    private readonly resourcesService: ResourcesService,
  ) {}

  @Post('publish/:resourceId')
  async publishToChannel(@Param('resourceId') resourceId: string) {
    const resource = await this.resourcesService.findOne(resourceId);
    await this.channelPosterService.publishToChannel(resource);
    return { success: true, message: 'Published to channel' };
  }

  @Post('pin/:resourceId')
  async pinPost(
    @Param('resourceId') resourceId: string,
    @Body() body: { hours?: number },
  ) {
    const resource = await this.resourcesService.findOne(resourceId);
    await this.channelPosterService.pinPost(resource, body.hours || 24);
    return { success: true, message: 'Post pinned' };
  }
}


