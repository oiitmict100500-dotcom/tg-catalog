import { Injectable } from '@nestjs/common';
import { ResourcesService } from '../resources/resources.service';
import { ChannelPosterService } from '../channel-poster/channel-poster.service';
import { SubmissionStatus } from '../resources/entities/submission.entity';

@Injectable()
export class ModerationService {
  constructor(
    private readonly resourcesService: ResourcesService,
    private readonly channelPosterService: ChannelPosterService,
  ) {}

  async getPendingSubmissions() {
    return this.resourcesService.getSubmissions(SubmissionStatus.PENDING);
  }

  async approveSubmission(submissionId: string, moderatorId: string) {
    const resource = await this.resourcesService.approveSubmission(submissionId, moderatorId);
    
    // Auto-publish to Telegram channel if enabled
    if (resource.autoPublishToTg) {
      try {
        await this.channelPosterService.publishToChannel(resource);
      } catch (error) {
        console.error('Error publishing to channel:', error);
        // Don't fail the approval if channel publish fails
      }
    }
    
    return resource;
  }

  async rejectSubmission(submissionId: string, moderatorId: string, reason: string) {
    return this.resourcesService.rejectSubmission(submissionId, moderatorId, reason);
  }
}

