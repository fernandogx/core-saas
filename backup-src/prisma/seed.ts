import 'dotenv/config'; // Substitua as duas linhas antigas do dotenv por esta
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const coreAdminApp = await prisma.application.upsert({
    where: { slug: 'core-admin' },
    update: {},
    create: {
      name: 'Core Admin',
      slug: 'core-admin',
      apiKey: 'placeholder-will-be-regenerated',
      isActive: true,
    },
  });

  console.log(`✅ Application Core Admin criada: ${coreAdminApp.id}`);

  const adminCustomer = await prisma.customer.upsert({
    where: {
      applicationId_email: {
        applicationId: coreAdminApp.id,
        email: process.env.CORE_ADMIN_EMAIL || 'admin@coresaas.local',
      },
    },
    update: {},
    create: {
      applicationId: coreAdminApp.id,
      name: 'Administrador do Core',
      document: '00000000000',
      email: process.env.CORE_ADMIN_EMAIL || 'admin@coresaas.local',
    },
  });

  console.log(`✅ Customer Admin criado: ${adminCustomer.id}`);

  const passwordHash = await bcrypt.hash(
    process.env.CORE_ADMIN_PASSWORD || 'Admin@123456',
    10,
  );

  const adminUser = await prisma.user.upsert({
    where: { email: process.env.CORE_ADMIN_EMAIL || 'admin@coresaas.local' },
    update: {},
    create: {
      customerId: adminCustomer.id,
      name: 'Administrador',
      email: process.env.CORE_ADMIN_EMAIL || 'admin@coresaas.local',
      passwordHash,
      role: 'OWNER',
    },
  });

  console.log(`✅ User Admin criado: ${adminUser.id}`);
  console.log('');
  console.log('🔑 Credenciais de acesso:');
  console.log(`   Email: ${process.env.CORE_ADMIN_EMAIL || 'admin@coresaas.local'}`);
  console.log(`   Senha: ${process.env.CORE_ADMIN_PASSWORD || 'Admin@123456'}`);
  console.log('');
  console.log('🌱 Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });