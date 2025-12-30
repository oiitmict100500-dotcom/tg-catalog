import axios from 'axios';

export class ModerationService {
  constructor(private apiUrl: string) {}

  async approveSubmission(submissionId: string, moderatorId: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/moderation/approve/${submissionId}`,
        { moderatorId },
      );
      return response.data;
    } catch (error) {
      console.error('Error approving submission:', error);
      throw error;
    }
  }

  async rejectSubmission(submissionId: string, moderatorId: string, reason: string) {
    try {
      const response = await axios.post(
        `${this.apiUrl}/moderation/reject/${submissionId}`,
        { moderatorId, reason },
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting submission:', error);
      throw error;
    }
  }
}


