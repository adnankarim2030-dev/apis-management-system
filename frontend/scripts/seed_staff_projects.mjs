import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Staff Projects & Tasks Seeding ---');

  // Fetch users
  const users = await prisma.user.findMany();
  const userMap = {};
  users.forEach(u => {
    userMap[u.email.toLowerCase()] = u;
  });

  // Fetch clients
  const clients = await prisma.client.findMany();
  const clientMap = {};
  clients.forEach(c => {
    clientMap[c.company] = c;
  });

  const getClient = (name) => {
    return clientMap[name] || clients[0];
  };

  const newProjectsData = [
    {
      name: 'Enterprise Strategic Expansion 2026',
      projectCode: 'PRJ-1005',
      description: 'Strategic corporate growth plan, commercial models, and enterprise partnerships expansion.',
      clientName: 'Apex Global Technologies',
      managerEmail: 'noel@apis.com',
      budget: 145000,
      priority: 'HIGH',
      status: 'ACTIVE',
      progress: 45,
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      tasks: [
        {
          title: 'Finalize Q4 Corporate Growth Strategy & Key Partnerships',
          taskCode: 'TSK-501',
          priority: 'HIGH',
          estimatedHours: 24,
          actualHours: 18,
          status: 'IN_PROGRESS',
        },
        {
          title: 'Enterprise Client Revenue Model & Contract Structuring',
          taskCode: 'TSK-502',
          priority: 'MEDIUM',
          estimatedHours: 16,
          actualHours: 12,
          status: 'TO_DO',
        },
      ],
    },
    {
      name: 'National Retail & Franchise Outreach Campaign',
      projectCode: 'PRJ-1006',
      description: 'Retail business development, partner pipeline development, and regional commercial contracts.',
      clientName: 'Kinza Retail Corporation',
      managerEmail: 'kashif@apis.com',
      budget: 85000,
      priority: 'MEDIUM',
      status: 'ACTIVE',
      progress: 60,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tasks: [
        {
          title: 'B2B Brand Partnership Pipeline Outreach',
          taskCode: 'TSK-601',
          priority: 'HIGH',
          estimatedHours: 20,
          actualHours: 16,
          status: 'IN_PROGRESS',
        },
        {
          title: 'Client Proposal Presentations & Commercial Terms',
          taskCode: 'TSK-602',
          priority: 'MEDIUM',
          estimatedHours: 15,
          actualHours: 10,
          status: 'COMPLETED',
        },
      ],
    },
    {
      name: 'NextGen Digital Identity & UI/UX Design System',
      projectCode: 'PRJ-1007',
      description: 'Comprehensive design system, unified digital design tokens, and web/mobile UI components.',
      clientName: 'Starlight Media & Broadcast',
      managerEmail: 'abeel@apis.com',
      budget: 95000,
      priority: 'HIGH',
      status: 'ACTIVE',
      progress: 70,
      deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
      tasks: [
        {
          title: 'Design Unified Mobile & Web Design Tokens',
          taskCode: 'TSK-701',
          priority: 'URGENT',
          estimatedHours: 30,
          actualHours: 28,
          status: 'IN_PROGRESS',
        },
        {
          title: 'Interactive Prototype & Brand Assets Guidelines',
          taskCode: 'TSK-702',
          priority: 'HIGH',
          estimatedHours: 22,
          actualHours: 20,
          status: 'COMPLETED',
        },
      ],
    },
    {
      name: 'Performance Marketing & Digital Media Strategy',
      projectCode: 'PRJ-1008',
      description: 'Data-driven omnichannel performance marketing, conversion funnel optimization, and attribution.',
      clientName: 'Horizon Telecom Group',
      managerEmail: 'fahim@apis.com',
      budget: 110000,
      priority: 'HIGH',
      status: 'ACTIVE',
      progress: 40,
      deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      tasks: [
        {
          title: 'Multi-Channel Digital Audience Segmentation',
          taskCode: 'TSK-801',
          priority: 'HIGH',
          estimatedHours: 25,
          actualHours: 14,
          status: 'IN_PROGRESS',
        },
        {
          title: 'Performance Analytics & Conversion Funnel Optimization',
          taskCode: 'TSK-802',
          priority: 'MEDIUM',
          estimatedHours: 18,
          actualHours: 8,
          status: 'TO_DO',
        },
      ],
    },
    {
      name: 'Omnichannel Creative Visuals & Content Campaign',
      projectCode: 'PRJ-1009',
      description: 'Creative campaign assets, brand storytelling visuals, social creatives, and motion graphics.',
      clientName: 'Kinza Retail Corporation',
      managerEmail: 'fatima@apis.com',
      budget: 65000,
      priority: 'MEDIUM',
      status: 'ACTIVE',
      progress: 55,
      deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      tasks: [
        {
          title: 'Produce Social Media & Digital Ad Visuals',
          taskCode: 'TSK-901',
          priority: 'HIGH',
          estimatedHours: 22,
          actualHours: 19,
          status: 'COMPLETED',
        },
        {
          title: 'Motion Graphics & Promo Storyboard Concepts',
          taskCode: 'TSK-902',
          priority: 'MEDIUM',
          estimatedHours: 18,
          actualHours: 12,
          status: 'IN_PROGRESS',
        },
      ],
    },
    {
      name: 'OOH Prime Billboard & Media Spot Operations',
      projectCode: 'PRJ-1010',
      description: 'High-visibility out-of-home billboard campaign management, site verification, and execution.',
      clientName: 'FALAK NAZ',
      managerEmail: 'maha@apis.com',
      budget: 175000,
      priority: 'URGENT',
      status: 'ACTIVE',
      progress: 65,
      deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
      tasks: [
        {
          title: 'Prime OOH Billboard Site Coordination & Verification',
          taskCode: 'TSK-1001',
          priority: 'URGENT',
          estimatedHours: 28,
          actualHours: 22,
          status: 'IN_PROGRESS',
        },
        {
          title: 'Broadcast Scheduling & Campaign Proof of Performance',
          taskCode: 'TSK-1002',
          priority: 'HIGH',
          estimatedHours: 16,
          actualHours: 15,
          status: 'COMPLETED',
        },
      ],
    },
    {
      name: 'Strategic Media Buying & Rate Optimization',
      projectCode: 'PRJ-1011',
      description: 'Omnichannel media procurement, vendor rate optimization, and broadcast schedule auditing.',
      clientName: 'Starlight Media & Broadcast',
      managerEmail: 'naeem@apis.com',
      budget: 210000,
      priority: 'HIGH',
      status: 'ACTIVE',
      progress: 50,
      deadline: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
      tasks: [
        {
          title: 'Q4 Media Inventory Procurement & Rate Negotiations',
          taskCode: 'TSK-1101',
          priority: 'HIGH',
          estimatedHours: 35,
          actualHours: 24,
          status: 'IN_PROGRESS',
        },
      ],
    },
  ];

  for (const item of newProjectsData) {
    const manager = userMap[item.managerEmail.toLowerCase()];
    if (!manager) {
      console.log(`Skipping ${item.name}: manager ${item.managerEmail} not found`);
      continue;
    }
    const client = getClient(item.clientName);

    // Upsert project
    let project = await prisma.project.findFirst({
      where: { projectCode: item.projectCode },
    });

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: item.name,
          projectCode: item.projectCode,
          description: item.description,
          budget: item.budget,
          priority: item.priority,
          status: item.status,
          progress: item.progress,
          deadline: item.deadline,
          clientId: client.id,
          projectManagerId: manager.id,
          departmentId: manager.departmentId || null,
        },
      });
      console.log(`Created Project: [${project.projectCode}] ${project.name} (Manager: ${manager.name})`);
    } else {
      console.log(`Project already exists: [${project.projectCode}] ${project.name}`);
    }

    // Ensure manager is in project members (and only manager, so it remains private to this staff member)
    await prisma.projectMember.deleteMany({
      where: { projectId: project.id },
    });
    await prisma.projectMember.create({
      data: {
        projectId: project.id,
        userId: manager.id,
        role: 'LEAD',
      },
    });

    // Create tasks
    for (const t of item.tasks) {
      const existingTask = await prisma.task.findFirst({
        where: { taskCode: t.taskCode },
      });
      if (!existingTask) {
        await prisma.task.create({
          data: {
            title: t.title,
            taskCode: t.taskCode,
            projectId: project.id,
            assigneeId: manager.id,
            priority: t.priority,
            status: t.status,
            estimatedHours: t.estimatedHours,
            actualHours: t.actualHours,
            dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          },
        });
        console.log(`  -> Created Task: [${t.taskCode}] ${t.title} (Assignee: ${manager.name})`);
      }
    }

    // Create Risk record
    const existingRisk = await prisma.projectRisk.findFirst({
      where: { projectId: project.id },
    });
    if (!existingRisk) {
      await prisma.projectRisk.create({
        data: {
          projectId: project.id,
          riskLevel: item.progress < 50 ? 'MEDIUM' : 'LOW',
          healthScore: item.progress < 50 ? 82 : 94,
          deadlineRisk: 15,
          taskRisk: 12,
          workloadRisk: 18,
          reasons: JSON.stringify(['Active deliverable execution on schedule.']),
          recommendations: JSON.stringify(['Maintain sprint momentum.']),
        },
      });
    }
  }

  console.log('\n--- Seeding completed successfully! ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
