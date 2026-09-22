import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  const adminEmail = 'admin@coresaas.local';
  const adminPassword = 'Admin@123456';

  // 1. Cria a Application "Core Admin"
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

  // 2. Cria o Customer Admin
  const adminCustomer = await prisma.customer.upsert({
    where: {
      applicationId_email: {
        applicationId: coreAdminApp.id,
        email: adminEmail,
      },
    },
    update: {},
    create: {
      applicationId: coreAdminApp.id,
      name: 'Administrador do Core',
      document: '00000000000',
      email: adminEmail,
    },
  });
  console.log(`✅ Customer Admin criado: ${adminCustomer.id}`);

  // 3. Cria o User Admin
  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      customerId: adminCustomer.id,
      name: 'Administrador',
      email: adminEmail,
      passwordHash,
      role: 'OWNER',
    },
  });
  console.log(`✅ User Admin criado: ${adminUser.id}`);
  
  console.log('');
  console.log('🔑 Credenciais de acesso:');
  console.log(`   Email: ${adminEmail}`);
  console.log(`   Senha: ${adminPassword}`);
  console.log('');
  console.log('🌱 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });