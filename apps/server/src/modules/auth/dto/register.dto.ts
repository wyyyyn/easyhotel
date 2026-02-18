import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, MinLength, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ description: '用户名', example: 'merchant01' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({ description: '密码', example: '123456' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  @ApiProperty({
    description: '用户角色',
    enum: ['MERCHANT', 'ADMIN'],
    example: 'MERCHANT',
  })
  @IsEnum(['MERCHANT', 'ADMIN'], { message: '角色必须是 MERCHANT 或 ADMIN' })
  role: 'MERCHANT' | 'ADMIN';
}
