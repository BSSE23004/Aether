import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole, Prisma } from '@prisma/client';
import { CommunitiesService } from './communities.service';
import { PrismaService } from '../../database/prisma.service';

const now = new Date('2026-06-01T12:00:00.000Z');

const baseCommunity = {
  id: 'comm-1',
  slug: 'aether-test',
  name: 'Aether Test',
  description: 'Test community',
  logoUrl: null,
  bannerUrl: null,
  tokenGated: false,
  tokenAddress: null,
  tokenSymbol: null,
  creatorId: 'user-1',
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  _count: { members: 1 },
};

function createPrismaMock() {
  return {
    community: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    communityMember: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };
}

describe('CommunitiesService', () => {
  let service: CommunitiesService;
  let prisma: ReturnType<typeof createPrismaMock>;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new CommunitiesService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a community and assigns creator as admin', async () => {
      prisma.$transaction.mockImplementation(async (callback) => {
        prisma.community.create.mockResolvedValue({ ...baseCommunity, _count: { members: 0 } });
        prisma.communityMember.create.mockResolvedValue({});
        return callback(prisma);
      });

      const result = await service.create('user-1', {
        slug: 'Aether-Test',
        name: 'Aether Test',
        description: 'Test community',
      });

      expect(prisma.community.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slug: 'aether-test',
            creatorId: 'user-1',
          }),
        }),
      );
      expect(prisma.communityMember.create).toHaveBeenCalledWith({
        data: {
          communityId: 'comm-1',
          userId: 'user-1',
          role: MemberRole.ADMIN,
        },
      });
      expect(result.slug).toBe('aether-test');
      expect(result.members).toBe(1);
    });

    it('throws ConflictException when slug already exists', async () => {
      const error = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
        code: 'P2002',
        clientVersion: '5.7.0',
      });
      prisma.$transaction.mockRejectedValue(error);

      await expect(
        service.create('user-1', { slug: 'taken', name: 'Taken' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('findAll', () => {
    it('returns paginated communities', async () => {
      prisma.community.findMany.mockResolvedValue([baseCommunity]);
      prisma.community.count.mockResolvedValue(1);

      const result = await service.findAll({ page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.hasMore).toBe(false);
      expect(result.items[0]?.name).toBe('Aether Test');
    });
  });

  describe('findOne', () => {
    it('finds community by slug', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);

      const result = await service.findOne('aether-test');

      expect(result.id).toBe('comm-1');
      expect(prisma.community.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [{ id: 'aether-test' }, { slug: 'aether-test' }],
          }),
        }),
      );
    });

    it('throws NotFoundException when community is missing', async () => {
      prisma.community.findFirst.mockResolvedValue(null);

      await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('join', () => {
    it('adds a new member', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);
      prisma.communityMember.findUnique.mockResolvedValue(null);
      prisma.communityMember.upsert.mockResolvedValue({
        id: 'member-1',
        userId: 'user-2',
        role: MemberRole.MEMBER,
        joinedAt: now,
        user: {
          id: 'user-2',
          username: 'alice',
          displayName: 'Alice',
          avatarUrl: null,
        },
      });

      const result = await service.join('comm-1', 'user-2');

      expect(result.userId).toBe('user-2');
      expect(result.role).toBe(MemberRole.MEMBER);
    });

    it('rejects duplicate active membership', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);
      prisma.communityMember.findUnique.mockResolvedValue({
        deletedAt: null,
        isActive: true,
      });

      await expect(service.join('comm-1', 'user-2')).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects token-gated communities', async () => {
      prisma.community.findFirst.mockResolvedValue({ ...baseCommunity, tokenGated: true });

      await expect(service.join('comm-1', 'user-2')).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('leave', () => {
    it('soft-deletes membership', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);
      prisma.communityMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: MemberRole.MEMBER,
      });
      prisma.communityMember.update.mockResolvedValue({});

      const result = await service.leave('comm-1', 'user-2');

      expect(result).toEqual({ ok: true });
      expect(prisma.communityMember.update).toHaveBeenCalledWith({
        where: { id: 'member-1' },
        data: {
          isActive: false,
          deletedAt: expect.any(Date),
        },
      });
    });

    it('prevents the only admin from leaving', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);
      prisma.communityMember.findFirst.mockResolvedValue({
        id: 'member-1',
        role: MemberRole.ADMIN,
      });
      prisma.communityMember.count.mockResolvedValue(1);

      await expect(service.leave('comm-1', 'user-1')).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws when user is not a member', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);
      prisma.communityMember.findFirst.mockResolvedValue(null);

      await expect(service.leave('comm-1', 'user-2')).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates community when caller is admin', async () => {
      prisma.community.findFirst
        .mockResolvedValueOnce(baseCommunity)
        .mockResolvedValueOnce(baseCommunity);
      prisma.communityMember.findFirst.mockResolvedValue({ role: MemberRole.ADMIN });
      prisma.community.update.mockResolvedValue({
        ...baseCommunity,
        name: 'Updated Name',
      });

      const result = await service.update('comm-1', 'user-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('rejects update from non-admin members', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);
      prisma.communityMember.findFirst.mockResolvedValue({ role: MemberRole.MEMBER });

      await expect(
        service.update('comm-1', 'user-2', { name: 'Hacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('listMembers', () => {
    it('returns paginated members', async () => {
      prisma.community.findFirst.mockResolvedValue(baseCommunity);
      prisma.communityMember.findMany.mockResolvedValue([
        {
          id: 'member-1',
          userId: 'user-1',
          role: MemberRole.ADMIN,
          joinedAt: now,
          user: {
            id: 'user-1',
            username: 'admin',
            displayName: 'Admin',
            avatarUrl: null,
          },
        },
      ]);
      prisma.communityMember.count.mockResolvedValue(1);

      const result = await service.listMembers('comm-1', { page: 1, limit: 20 });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.role).toBe(MemberRole.ADMIN);
    });
  });
});
