import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  login: string; // может быть username или email

  @IsNotEmpty()
  @IsString()
  password: string;
}

