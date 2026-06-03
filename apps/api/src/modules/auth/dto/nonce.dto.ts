import { IsEthereumAddress } from './validators';

export class NonceDto {
  @IsEthereumAddress()
  address: string;
}
