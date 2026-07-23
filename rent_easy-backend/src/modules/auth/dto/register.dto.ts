import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsEmail({}, { message: 'email must be an email' })
  @IsNotEmpty({ message: 'email should not be empty' })
  @Transform(({ value }) => value?.trim())
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'password should not be empty' })
  @MinLength(8, { message: 'password must be longer than or equal to 8 characters' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'fullName should not be empty' })
  @MaxLength(150, { message: 'fullName must be shorter than or equal to 150 characters' })
  @Transform(({ value }) => value?.trim())
  fullName: string;
}
