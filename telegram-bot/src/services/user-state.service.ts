import { UserState } from './bot.service';

interface SubmissionData {
  category?: string;
  link?: string;
  title?: string;
  description?: string;
  coverImage?: string;
  subscribersCount?: number;
}

export class UserStateService {
  private states: Map<string, UserState> = new Map();
  private submissionData: Map<string, SubmissionData> = new Map();

  setState(userId: string, state: UserState) {
    this.states.set(userId, state);
  }

  getState(userId: string): UserState {
    return this.states.get(userId) || UserState.IDLE;
  }

  setCategory(userId: string, category: string) {
    const data = this.getSubmissionData(userId);
    data.category = category;
    this.submissionData.set(userId, data);
  }

  setLink(userId: string, link: string) {
    const data = this.getSubmissionData(userId);
    data.link = link;
    this.submissionData.set(userId, data);
  }

  setTitle(userId: string, title: string) {
    const data = this.getSubmissionData(userId);
    data.title = title;
    this.submissionData.set(userId, data);
  }

  setDescription(userId: string, description: string) {
    const data = this.getSubmissionData(userId);
    data.description = description;
    this.submissionData.set(userId, data);
  }

  setCoverImage(userId: string, coverImage: string) {
    const data = this.getSubmissionData(userId);
    data.coverImage = coverImage;
    this.submissionData.set(userId, data);
  }

  getSubmissionData(userId: string): SubmissionData {
    return this.submissionData.get(userId) || {};
  }

  clearState(userId: string) {
    this.states.delete(userId);
    this.submissionData.delete(userId);
  }
}


