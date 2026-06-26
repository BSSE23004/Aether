import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content: string;

  @IsOptional()
  metadata?: any;
}
