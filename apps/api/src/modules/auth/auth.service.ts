import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { verifySignature } from '@aether/auth';
import { randomBytes } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { NonceDto } from './dto/nonce.dto';
import { VerifyDto } from './dto/verify.dto';
import { signJwt, verifyJwt } from './auth.jwt';

@Injectable()
export class AuthService {
  private readonly nonceTtlMs = 10 * 60 * 1000;
  private readonly refreshTtlMs = 30 * 24 * 60 * 60 * 1000;
  private readonly nonces = new Map<string, { nonce: string; expiresAt: number; used: boolean }>();

  constructor(private readonly prisma: PrismaService) {}

  async generateNonce(dto: NonceDto) {
    const address = dto.address.toLowerCase();
    const nonce = randomBytes(18).toString('hex');
    this.nonces.set(address, { nonce, expiresAt: Date.now() + this.nonceTtlMs, used: false });

    return { nonce, address, expiresAt: new Date(Date.now() + this.nonceTtlMs).toISOString() };
  }

  async login(dto: LoginDto) {
    const address = dto.address.toLowerCase();
    const nonceEntry = this.nonces.get(address);

    if (!nonceEntry || nonceEntry.used || nonceEntry.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired nonce');
    }

    const message = `Aether SIWE challenge\nNonce: ${nonceEntry.nonce}\nAddress: ${address}`;
    const recovered = await verifySignature(message, dto.signature);

    if (!recovered || recovered.toLowerCase() !== address) {
      throw new UnauthorizedException('Signature verification failed');
    }

    nonceEntry.used = true;
    this.nonces.delete(address);

    return this.issueSession(address);
  }

  async verify(dto: VerifyDto) {
    const address = dto.address.toLowerCase();
    const nonceEntry = this.nonces.get(address);

    if (!nonceEntry || nonceEntry.used || nonceEntry.expiresAt < Date.now()) {
      throw new BadRequestException('Invalid or expired nonce');
    }

    if (dto.nonce !== nonceEntry.nonce) {
      throw new BadRequestException('Nonce mismatch');
    }

    const message = `Aether SIWE challenge\nNonce: ${dto.nonce}\nAddress: ${address}`;
    const recovered = await verifySignature(message, dto.signature);

    if (!recovered || recovered.toLowerCase() !== address) {
      throw new UnauthorizedException('Signature verification failed');
    }

    nonceEntry.used = true;
    this.nonces.delete(address);

    return this.issueSession(address);
  }

  async logout(dto: LogoutDto) {
    await this.prisma.session.updateMany({
      where: { token: dto.refreshToken, revoked: false },
      data: { revoked: true },
    });

    return { ok: true };
  }

  async me(token: string) {
    const payload = verifyJwt(token);
    const user = await this.prisma.user.findUnique({
      where: { id: String(payload.sub) },
      include: { wallets: true },
    });

    if (!user) {
      throw new UnauthorizedException('User session not found');
    }

    return { user };
  }

  private async issueSession(address: string) {
    let user = await this.prisma.user.findFirst({
      where: { wallets: { some: { address, chain: 'base-sepolia' } } },
      include: { wallets: true },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          username: `wallet-${address.slice(2, 8)}`,
          displayName: `Wallet ${address.slice(0, 6)}...${address.slice(-4)}`,
        },
        include: { wallets: true },
      });
    }

    await this.prisma.wallet.upsert({
      where: { address_chain: { address, chain: 'base-sepolia' } },
      update: { userId: user.id, lastSeenAt: new Date(), isPrimary: true },
      create: { address, chain: 'base-sepolia', userId: user.id, isPrimary: true },
    });

    const accessToken = signJwt({ sub: user.id, type: 'access', address }, 15);
    const refreshToken = signJwt({ sub: user.id, type: 'refresh', address }, 60 * 24 * 7);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
        revoked: false,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        wallets: user.wallets,
      },
    };
  }
}
