import { IsString, IsNotEmpty, IsOptional, IsUrl, IsEnum } from 'class-validator';
import { SubmissionSource } from '../entities/submission.entity';

export class CreateSubmissionDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsNotEmpty()
  telegramLink: string;

  @IsString()
  @IsOptional()
  coverImage?: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @IsEnum(SubmissionSource)
  source: SubmissionSource;

  @IsOptional()
  subscribersCount?: number;
}


