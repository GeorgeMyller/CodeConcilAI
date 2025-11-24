const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database (CJS runner)...');

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

  // Create sample transactions if not present
  const tx1 = await prisma.transaction.findFirst({
    where: { userId: user.id, description: 'First startup audit', amount: 50 }
  });
  if (!tx1) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        tier: 'startup',
        amount: 50,
        status: 'completed',
        description: 'First startup audit'
      }
    });
  }

  const tx2 = await prisma.transaction.findFirst({
    where: { userId: user.id, description: 'Enterprise deep dive', amount: 150 }
  });
  if (!tx2) {
    await prisma.transaction.create({
      data: {
        userId: user.id,
        tier: 'enterprise',
        amount: 150,
        status: 'completed',
        description: 'Enterprise deep dive'
      }
    });
  }

  console.log('✓ Created sample transactions');

  console.log('✅ Database seeded successfully (CJS runner)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
