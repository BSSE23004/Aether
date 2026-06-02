import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // Placeholder: implement JWT/wallet session validation
    const request = context.switchToHttp().getRequest();
    // allow all for now
    return true;
  }
}
