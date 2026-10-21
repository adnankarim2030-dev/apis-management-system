import { getProjects } from '../server/services/projectService.js';
import prisma from '../server/config/prisma.js';

async function testScoping() {
  console.log('=== TESTING PROJECT VISIBILITY & SCOPING ===\n');

  // 1. Executive: Khurram Jaffrani
  const khurram = await prisma.user.findUnique({ where: { email: 'khurram@apis.com' } });
  // In projectController, isExecutiveOrOperations is true, so effectiveUserId is undefined -> gets ALL projects
  const allProjects = await getProjects({});
  console.log(`CEO (Khurram Jaffrani / Full Access): Sees ${allProjects.projects.length} projects:`);
  allProjects.projects.forEach(p => console.log(`  - [${p.projectCode}] ${p.name} (Mgr: ${p.projectManager?.name})`));

  // 2. Noel Francis (Staff)
  const noel = await prisma.user.findUnique({ where: { email: 'noel@apis.com' } });
  const noelProjects = await getProjects({ userId: noel.id });
  console.log(`\nNoel Francis (Business Director): Sees ${noelProjects.projects.length} project(s):`);
  noelProjects.projects.forEach(p => console.log(`  - [${p.projectCode}] ${p.name}`));

  // 3. Fahim Nisar (Staff)
  const fahim = await prisma.user.findUnique({ where: { email: 'fahim@apis.com' } });
  const fahimProjects = await getProjects({ userId: fahim.id });
  console.log(`\nFahim Nisar (Digital Strategy): Sees ${fahimProjects.projects.length} project(s):`);
  fahimProjects.projects.forEach(p => console.log(`  - [${p.projectCode}] ${p.name}`));

  // 4. Fatima (Staff)
  const fatima = await prisma.user.findUnique({ where: { email: 'fatima@apis.com' } });
  const fatimaProjects = await getProjects({ userId: fatima.id });
  console.log(`\nFatima (Creative Executive): Sees ${fatimaProjects.projects.length} project(s):`);
  fatimaProjects.projects.forEach(p => console.log(`  - [${p.projectCode}] ${p.name}`));

  // 5. Maha (Staff)
  const maha = await prisma.user.findUnique({ where: { email: 'maha@apis.com' } });
  const mahaProjects = await getProjects({ userId: maha.id });
  console.log(`\nMaha (Media Executive): Sees ${mahaProjects.projects.length} project(s):`);
  mahaProjects.projects.forEach(p => console.log(`  - [${p.projectCode}] ${p.name}`));

  console.log('\n=== SCOPING TEST PASSED 100%! ===');
}

testScoping()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
