import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MemberRole, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { CreateCommunityDto } from './dto/create-community.dto';
import { ListCommunitiesQueryDto } from './dto/list-communities-query.dto';
import { ListMembersQueryDto } from './dto/list-members-query.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';
import {
  CommunityEntity,
  CommunityMemberEntity,
  PaginatedResult,
} from './entities/community.entity';

const ACTIVE_MEMBER_WHERE: Prisma.CommunityMemberWhereInput = {
  deletedAt: null,
  isActive: true,
};

const ROLE_RANK: Record<MemberRole, number> = {
  MEMBER: 1,
  MODERATOR: 2,
  ADMIN: 3,
};

type CommunityWithCount = Prisma.CommunityGetPayload<{
  include: { _count: { select: { members: true } } };
}>;

@Injectable()
export class CommunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateCommunityDto): Promise<CommunityEntity> {
    const slug = dto.slug.toLowerCase();

    try {
      const community = await this.prisma.$transaction(async (tx) => {
        const created = await tx.community.create({
          data: {
            slug,
            name: dto.name,
            description: dto.description,
            logoUrl: dto.logoUrl,
            bannerUrl: dto.bannerUrl,
            tokenGated: dto.tokenGated ?? false,
            tokenAddress: dto.tokenAddress,
            tokenSymbol: dto.tokenSymbol,
            creatorId: userId,
          },
          include: {
            _count: {
              select: {
                members: { where: ACTIVE_MEMBER_WHERE },
              },
            },
          },
        });

        await tx.communityMember.create({
          data: {
            communityId: created.id,
            userId,
            role: MemberRole.ADMIN,
          },
        });

        return {
          ...created,
          _count: { members: created._count.members + 1 },
        };
      });

      return this.toCommunityEntity(community);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Community slug already exists');
      }
      throw error;
    }
  }

  async findAll(query: ListCommunitiesQueryDto): Promise<PaginatedResult<CommunityEntity>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityWhereInput = {
      deletedAt: null,
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { slug: { contains: query.search.toLowerCase(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              members: { where: ACTIVE_MEMBER_WHERE },
            },
          },
        },
      }),
      this.prisma.community.count({ where }),
    ]);

    return {
      items: communities.map((community) => this.toCommunityEntity(community)),
      total,
      page,
      limit,
      hasMore: skip + communities.length < total,
    };
  }

  async findOne(idOrSlug: string): Promise<CommunityEntity> {
    const community = await this.findCommunityRecord(idOrSlug);
    return this.toCommunityEntity(community);
  }

  async update(
    idOrSlug: string,
    userId: string,
    dto: UpdateCommunityDto,
  ): Promise<CommunityEntity> {
    const community = await this.findCommunityRecord(idOrSlug);
    await this.assertMemberHasRole(community.id, userId, MemberRole.ADMIN);

    if (dto.slug && dto.slug !== community.slug) {
      const slugExists = await this.prisma.community.findFirst({
        where: { slug: dto.slug.toLowerCase(), deletedAt: null, NOT: { id: community.id } },
      });
      if (slugExists) {
        throw new ConflictException('Community slug already exists');
      }
    }

    try {
      const updated = await this.prisma.community.update({
        where: { id: community.id },
        data: {
          ...(dto.slug !== undefined ? { slug: dto.slug.toLowerCase() } : {}),
          ...(dto.name !== undefined ? { name: dto.name } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
          ...(dto.logoUrl !== undefined ? { logoUrl: dto.logoUrl } : {}),
          ...(dto.bannerUrl !== undefined ? { bannerUrl: dto.bannerUrl } : {}),
          ...(dto.tokenGated !== undefined ? { tokenGated: dto.tokenGated } : {}),
          ...(dto.tokenAddress !== undefined ? { tokenAddress: dto.tokenAddress } : {}),
          ...(dto.tokenSymbol !== undefined ? { tokenSymbol: dto.tokenSymbol } : {}),
        },
        include: {
          _count: {
            select: {
              members: { where: ACTIVE_MEMBER_WHERE },
            },
          },
        },
      });

      return this.toCommunityEntity(updated);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Community slug already exists');
      }
      throw error;
    }
  }

  async join(idOrSlug: string, userId: string): Promise<CommunityMemberEntity> {
    const community = await this.findCommunityRecord(idOrSlug);

    if (community.tokenGated) {
      throw new ForbiddenException('Token-gated communities require on-chain verification');
    }

    const existing = await this.prisma.communityMember.findUnique({
      where: {
        communityId_userId: { communityId: community.id, userId },
      },
      include: { user: true },
    });

    if (existing?.deletedAt === null && existing.isActive) {
      throw new ConflictException('Already a member of this community');
    }

    const member = await this.prisma.communityMember.upsert({
      where: {
        communityId_userId: { communityId: community.id, userId },
      },
      create: {
        communityId: community.id,
        userId,
        role: MemberRole.MEMBER,
      },
      update: {
        deletedAt: null,
        isActive: true,
        joinedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return this.toMemberEntity(member);
  }

  async leave(idOrSlug: string, userId: string): Promise<{ ok: true }> {
    const community = await this.findCommunityRecord(idOrSlug);

    const member = await this.prisma.communityMember.findFirst({
      where: {
        communityId: community.id,
        userId,
        deletedAt: null,
        isActive: true,
      },
    });

    if (!member) {
      throw new BadRequestException('Not a member of this community');
    }

    if (member.role === MemberRole.ADMIN) {
      const adminCount = await this.prisma.communityMember.count({
        where: {
          communityId: community.id,
          role: MemberRole.ADMIN,
          deletedAt: null,
          isActive: true,
        },
      });

      if (adminCount <= 1) {
        throw new ForbiddenException('Cannot leave: you are the only admin');
      }
    }

    await this.prisma.communityMember.update({
      where: { id: member.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return { ok: true };
  }

  async listMembers(
    idOrSlug: string,
    query: ListMembersQueryDto,
  ): Promise<PaginatedResult<CommunityMemberEntity>> {
    const community = await this.findCommunityRecord(idOrSlug);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.CommunityMemberWhereInput = {
      communityId: community.id,
      ...ACTIVE_MEMBER_WHERE,
    };

    const [members, total] = await Promise.all([
      this.prisma.communityMember.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ role: 'desc' }, { joinedAt: 'asc' }],
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      }),
      this.prisma.communityMember.count({ where }),
    ]);

    return {
      items: members.map((member) => this.toMemberEntity(member)),
      total,
      page,
      limit,
      hasMore: skip + members.length < total,
    };
  }

  async isMember(communityId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        ...ACTIVE_MEMBER_WHERE,
      },
    });
    return Boolean(member);
  }

  async getMemberRole(communityId: string, userId: string): Promise<MemberRole | null> {
    const member = await this.prisma.communityMember.findFirst({
      where: {
        communityId,
        userId,
        ...ACTIVE_MEMBER_WHERE,
      },
      select: { role: true },
    });
    return member?.role ?? null;
  }

  async resolveCommunityId(idOrSlug: string): Promise<string> {
    const community = await this.findCommunityRecord(idOrSlug);
    return community.id;
  }

  private async findCommunityRecord(idOrSlug: string): Promise<CommunityWithCount> {
    const community = await this.prisma.community.findFirst({
      where: {
        deletedAt: null,
        OR: [{ id: idOrSlug }, { slug: idOrSlug.toLowerCase() }],
      },
      include: {
        _count: {
          select: {
            members: { where: ACTIVE_MEMBER_WHERE },
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return community;
  }

  private async assertMemberHasRole(
    communityId: string,
    userId: string,
    minimumRole: MemberRole,
  ): Promise<void> {
    const role = await this.getMemberRole(communityId, userId);

    if (!role) {
      throw new ForbiddenException('Community membership required');
    }

    if (ROLE_RANK[role] < ROLE_RANK[minimumRole]) {
      throw new ForbiddenException('Insufficient community role');
    }
  }

  private toCommunityEntity(community: CommunityWithCount): CommunityEntity {
    return {
      id: community.id,
      slug: community.slug,
      name: community.name,
      description: community.description,
      logo: community.logoUrl,
      banner: community.bannerUrl,
      members: community._count.members,
      isTokenGated: community.tokenGated,
      tokenAddress: community.tokenAddress,
      tokenSymbol: community.tokenSymbol,
      creatorId: community.creatorId,
      createdAt: community.createdAt.toISOString(),
      updatedAt: community.updatedAt.toISOString(),
    };
  }

  private toMemberEntity(
    member: Prisma.CommunityMemberGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            username: true;
            displayName: true;
            avatarUrl: true;
          };
        };
      };
    }>,
  ): CommunityMemberEntity {
    return {
      id: member.id,
      userId: member.userId,
      role: member.role,
      joinedAt: member.joinedAt.toISOString(),
      user: member.user,
    };
  }
}
