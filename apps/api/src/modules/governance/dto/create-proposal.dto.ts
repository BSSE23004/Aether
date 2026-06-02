import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProposalDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  communityId: string;
}
