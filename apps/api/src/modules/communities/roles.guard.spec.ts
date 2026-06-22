import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MemberRole } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { CommunitiesService } from './communities.service';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let communitiesService: jest.Mocked<Pick<CommunitiesService, 'resolveCommunityId' | 'getMemberRole'>>;

  const createContext = (request: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as never;

  beforeEach(() => {
    reflector = new Reflector();
    communitiesService = {
      resolveCommunityId: jest.fn(),
      getMemberRole: jest.fn(),
    };
    guard = new RolesGuard(reflector, communitiesService as unknown as CommunitiesService);
  });

  it('allows access when no roles are required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const result = await guard.canActivate(createContext({ params: { id: 'comm-1' } }));

    expect(result).toBe(true);
  });

  it('rejects unauthenticated requests', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([MemberRole.ADMIN]);

    await expect(
      guard.canActivate(createContext({ params: { id: 'comm-1' } })),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('allows admins when admin role is required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([MemberRole.ADMIN]);
    communitiesService.resolveCommunityId.mockResolvedValue('comm-1');
    communitiesService.getMemberRole.mockResolvedValue(MemberRole.ADMIN);

    const request = { params: { id: 'comm-1' }, user: { sub: 'user-1' } };
    const result = await guard.canActivate(createContext(request));

    expect(result).toBe(true);
    expect(request).toMatchObject({ communityId: 'comm-1', memberRole: MemberRole.ADMIN });
  });

  it('rejects members when admin role is required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([MemberRole.ADMIN]);
    communitiesService.resolveCommunityId.mockResolvedValue('comm-1');
    communitiesService.getMemberRole.mockResolvedValue(MemberRole.MEMBER);

    await expect(
      guard.canActivate(createContext({ params: { id: 'comm-1' }, user: { sub: 'user-2' } })),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows moderators when moderator role is required', async () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([MemberRole.MODERATOR]);
    communitiesService.resolveCommunityId.mockResolvedValue('comm-1');
    communitiesService.getMemberRole.mockResolvedValue(MemberRole.MODERATOR);

    const result = await guard.canActivate(
      createContext({ params: { id: 'comm-1' }, user: { sub: 'user-2' } }),
    );

    expect(result).toBe(true);
  });
});
