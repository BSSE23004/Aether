import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  channelId: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  metadata?: any;
}
