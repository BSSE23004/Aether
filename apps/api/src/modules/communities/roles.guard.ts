import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { JwtPayload } from '../auth/auth.jwt';
import { CommunitiesService } from './communities.service';
import { ROLES_KEY } from './decorators/roles.decorator';

const ROLE_RANK: Record<MemberRole, number> = {
  MEMBER: 1,
  MODERATOR: 2,
  ADMIN: 3,
};

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly communitiesService: CommunitiesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload | undefined;

    if (!user?.sub) {
      throw new UnauthorizedException('Authentication required');
    }

    const idOrSlug = request.params?.id as string | undefined;
    if (!idOrSlug) {
      throw new ForbiddenException('Community context required');
    }

    const communityId = await this.communitiesService.resolveCommunityId(idOrSlug);
    const memberRole = await this.communitiesService.getMemberRole(communityId, user.sub);

    if (!memberRole) {
      throw new ForbiddenException('Community membership required');
    }

    const minRequiredRank = Math.min(...requiredRoles.map((role) => ROLE_RANK[role]));
    if (ROLE_RANK[memberRole] < minRequiredRank) {
      throw new ForbiddenException('Insufficient community role');
    }

    request.communityId = communityId;
    request.memberRole = memberRole;

    return true;
  }
}
