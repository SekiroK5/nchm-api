import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgresql://postgres:linux123@localhost:5432/GIDS0681",
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminUsername = 'admin';
  const existingAdmin = await prisma.user.findUnique({ where: { username: adminUsername } });

  if (!existingAdmin) {
    const password = await bcrypt.hash('Admin@1234', 10);
    await prisma.user.create({
      data: {
        name: 'Administrador',
        lastName: 'Sistema',
        username: adminUsername,
        password: password,
        role: 'ADMIN',
      },
    });
    console.log('Admin user created: admin / Admin@1234');
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
