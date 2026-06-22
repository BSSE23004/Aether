import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { IsEthereumAddress } from '../../auth/dto/validators';

export class CreateCommunityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with optional hyphens',
  })
  slug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  description?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsBoolean()
  tokenGated?: boolean;

  @IsOptional()
  @IsEthereumAddress()
  tokenAddress?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16)
  tokenSymbol?: string;
}
