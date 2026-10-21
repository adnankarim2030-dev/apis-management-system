import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const ceoRole = await prisma.role.findUnique({ where: { name: 'CEO' } });
  if (ceoRole) {
    const updated = await prisma.user.update({
      where: { email: 'adnan@apis.com' },
      data: { roleId: ceoRole.id },
      include: { role: true },
    });
    console.log('SUCCESS: Updated Adnan Karim role to:', updated.role.name);
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
