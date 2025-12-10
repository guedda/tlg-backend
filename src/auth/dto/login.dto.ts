import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Имя пользователя должно быть строкой' })
  @MinLength(1, { message: 'Имя пользователя не может быть пустым' })
  username!: string;

  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(5, { message: 'Пароль должен содержать минимум 5 символов' })
  password!: string;
}
