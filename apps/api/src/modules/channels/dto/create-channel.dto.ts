import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsString()
  @MaxLength(512)
  description?: string;

  @IsString()
  @IsNotEmpty()
  communityId: string;
}
