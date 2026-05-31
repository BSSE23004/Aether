/**
 * AppService - Root application service
 *
 * Provides:
 * - Health check endpoint
 * - System status
 */

import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  getInfo() {
    return {
      name: 'Aether API',
      version: '1.0.0',
      description: 'Web3 Collaboration Platform API',
      features: [
        'Wallet Authentication',
        'Real-time Messaging',
        'DAO Governance',
        'Token Gating',
        'Decentralized Storage',
        'On-chain Registry',
      ],
    };
  }
}
