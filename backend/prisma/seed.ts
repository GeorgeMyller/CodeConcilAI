import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const user = await prisma.user.create({
    data: {
      email: 'demo@codecouncil.ai',
      name: 'Demo User',
      googleId: 'demo-google-id',
      picture: 'https://ui-avatars.com/api/?name=Demo+User&background=6366f1&color=fff',
      credits: 400,
      isUnlimited: false
    }
  });

  console.log('✓ Created demo user:', user.email);

  // Create sample transactions
  await prisma.transaction.create({
    data: {
      userId: user.id,
      tier: 'startup',
      amount: 50,
      status: 'completed',
      description: 'First startup audit'
    }
  });

  await prisma.transaction.create({
    data: {
      userId: user.id,
      tier: 'enterprise',
      amount: 150,
      status: 'completed',
      description: 'Enterprise deep dive'
    }
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
