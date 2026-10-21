import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, designation: true, role: { select: { name: true } } }
  });
  console.log('=== USERS === (' + users.length + ')');
  users.forEach(u => console.log(`[${u.id}] ${u.email} | ${u.name} | ${u.designation} | Role: ${u.role?.name}`));

  const clients = await prisma.client.findMany({ select: { id: true, company: true, contactPerson: true } });
  console.log('\n=== CLIENTS === (' + clients.length + ')');
  clients.forEach(c => console.log(`[${c.id}] ${c.company} | ${c.contactPerson}`));

  const projects = await prisma.project.findMany({
    select: {
      id: true,
      name: true,
      projectCode: true,
      status: true,
      progress: true,
      projectManager: { select: { id: true, name: true, email: true } },
      members: { select: { user: { select: { id: true, name: true, email: true } } } },
      _count: { select: { tasks: true } }
    }
  });
  console.log('\n=== PROJECTS === (' + projects.length + ')');
  projects.forEach(p => {
    const mems = p.members.map(m => m.user.name).join(', ');
    console.log(`[${p.projectCode}] ${p.name} | Status: ${p.status} | Mgr: ${p.projectManager?.name} (${p.projectManager?.email}) | Tasks: ${p._count.tasks} | Members: ${mems}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
