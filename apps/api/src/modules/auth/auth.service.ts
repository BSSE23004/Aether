import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Placeholder for wallet-based auth and JWT generation
  async login(dto: LoginDto) {
    // In production implement signature verification + JWT issuance
    return { token: 'dev-token', wallet: dto.address };
  }
}
