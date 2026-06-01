const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create a sample user
  const user = await prisma.user.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: {
      username: 'alice',
      displayName: 'Alice',
      email: 'alice@example.com',
    },
  });

  // Create a wallet for user
  const wallet = await prisma.wallet.upsert({
    where: {
      address_chain: {
        address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
        chain: 'base-sepolia',
      },
    },
    update: {},
    create: {
      address: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      chain: 'base-sepolia',
      isPrimary: true,
      userId: user.id,
    },
  });

  // Create a community
  const community = await prisma.community.upsert({
    where: { slug: 'aether-test' },
    update: {},
    create: {
      slug: 'aether-test',
      name: 'Aether Test Community',
      description: 'Test community for local development',
      creatorId: user.id,
    },
  });

  // Add membership
  await prisma.communityMember.upsert({
    where: { communityId_userId: { communityId: community.id, userId: user.id } },
    update: {},
    create: {
      communityId: community.id,
      userId: user.id,
      role: 'ADMIN',
    },
  });

  // Create a channel
  const channel = await prisma.channel.create({
    data: {
      communityId: community.id,
      name: 'general',
      description: 'General chat',
      isPublic: true,
    },
  });

  // Post a message
  await prisma.message.create({
    data: {
      channelId: channel.id,
      authorId: user.id,
      content: 'Welcome to Aether (seeded message)!',
    },
  });

  // Create a DAO proposal
  const proposal = await prisma.daoProposal.create({
    data: {
      communityId: community.id,
      creatorId: user.id,
      title: 'Seed Proposal',
      description: 'This is a seeded proposal',
      status: 'PENDING',
    },
  });

  // Create chain sync state
  await prisma.chainSyncState.upsert({
    where: { chain: 'base-sepolia' },
    update: { lastBlock: 0 },
    create: { chain: 'base-sepolia', lastBlock: 0 },
  });

  // Create an AI summary sample
  await prisma.aiSummary.create({
    data: {
      sourceType: 'message',
      sourceId: 'seed-message-1',
      model: 'ollama-local',
      summary: 'Seed summary for local dev',
    },
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
