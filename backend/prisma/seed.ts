import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Upsert demo user for idempotency
  const user = await prisma.user.upsert({
    where: { email: 'demo@codecouncil.ai' },
    update: {},
    create: {
      email: 'demo@codecouncil.ai',
      name: 'Demo User',
      googleId: 'demo-google-id',
      picture: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff',
      credits: 400,
      isUnlimited: false
    }
  });

  console.log('✓ Created demo user:', user.email);

  // Create sample transactions (allow duplicates across runs)
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        tier: 'startup',
        amount: 50,
        status: 'completed',
        description: 'First startup audit'
      },
      {
        userId: user.id,
        tier: 'enterprise',
        amount: 150,
        status: 'completed',
        description: 'Enterprise deep dive'
      }
    ],
    skipDuplicates: true
  });

  console.log('✓ Created sample transactions');

  console.log('✅ Database seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
