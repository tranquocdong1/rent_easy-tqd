import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'test2@example.com';
  const password = '12345678';
  
  const passwordHash = await argon2.hash(password);
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      fullName: 'Test User',
      role: 'OWNER',
      isActive: true,
    },
  });
  
  console.log('✅ Test user created successfully!');
  console.log(`Email: ${user.email}`);
  console.log(`Password: ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
