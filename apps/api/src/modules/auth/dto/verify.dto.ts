import { IsNotEmpty, IsString } from 'class-validator';
import { IsEthereumAddress } from './validators';

export class VerifyDto {
  @IsEthereumAddress()
  address: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  nonce: string;
}
