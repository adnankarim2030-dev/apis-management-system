import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { calculateProjectRisk } from '../src/services/riskEngine';
import { recalculateProjectProgress } from '../src/services/progressEngine';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting APIS Database Seeding...');

  // Clear existing records in proper order
  await prisma.activityLog.deleteMany();
  await prisma.announcementReceipt.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.timesheet.deleteMany();
  await prisma.projectRisk.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.client.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  console.log('🧹 Cleaned existing database tables.');

  // 1. ROLES
  const roles = [
    { name: 'CEO', description: 'Chief Executive Officer with complete organizational oversight and executive intelligence.' },
    { name: 'ADMIN', description: 'System Administrator with full access to user management, configurations and security.' },
    { name: 'PROJECT_MANAGER', description: 'Manages project deliverables, sprints, task delegation, and timeline risk.' },
    { name: 'ACCOUNT_MANAGER', description: 'Client liaison managing client accounts, project scoping, and budgets.' },
    { name: 'DEPARTMENT_HEAD', description: 'Supervises departmental performance, resource allocations, and approvals.' },
    { name: 'STAFF', description: 'Execution staff executing assigned tasks, logging timesheets, and collaborating.' },
    { name: 'VIEWER', description: 'Read-only access for stakeholders and external auditing.' },
  ];

  const roleMap: Record<string, any> = {};
  for (const r of roles) {
    const created = await prisma.role.create({ data: r });
    roleMap[r.name] = created;
  }
  console.log('✅ Created 7 RBAC Roles.');

  // 2. DEPARTMENTS
  const depts = [
    { name: 'Executive Leadership', code: 'EXEC', description: 'C-Suite strategic direction and governance' },
    { name: 'Engineering & Technology', code: 'ENG', description: 'Core software engineering, DevOps, and cloud systems' },
    { name: 'Product & Design', code: 'PRD', description: 'UI/UX design, user research, and product strategy' },
    { name: 'Client Accounts & Strategy', code: 'ACC', description: 'Client acquisition, retention, and partnership growth' },
    { name: 'Operations & Media', code: 'OPS', description: 'Campaign delivery, field operations, and media scheduling' },
  ];

  const deptMap: Record<string, any> = {};
  for (const d of depts) {
    const created = await prisma.department.create({ data: d });
    deptMap[d.code] = created;
  }
  console.log('✅ Created Departments.');

  // 3. TEAMS
  const teams = [
    { name: 'Core Platform Team', code: 'ENG-CORE', departmentId: deptMap['ENG'].id },
    { name: 'Mobile & Cloud Team', code: 'ENG-MOB', departmentId: deptMap['ENG'].id },
    { name: 'Product Design Studio', code: 'DSN-PRO', departmentId: deptMap['PRD'].id },
    { name: 'Enterprise Accounts', code: 'ACC-ENT', departmentId: deptMap['ACC'].id },
    { name: 'Media Operations', code: 'OPS-MED', departmentId: deptMap['OPS'].id },
  ];

  const teamMap: Record<string, any> = {};
  for (const t of teams) {
    const created = await prisma.team.create({ data: t });
    teamMap[t.code] = created;
  }
  console.log('✅ Created Teams.');

  // 4. USERS
  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  const usersData = [
    {
      employeeId: 'EMP-0001',
      name: 'Khurram Jaffrani',
      email: 'khurram@apis.com',
      designation: 'Chief Executive Officer',
      phone: '+92 300 9999888',
      roleId: roleMap['CEO'].id,
      departmentId: deptMap['EXEC'].id,
      avatarUrl: '/avatars/khurram_jaffrani.png',
    },
    {
      employeeId: 'EMP-0002',
      name: 'Naeem Ahmed',
      email: 'naeem@apis.com',
      designation: 'Head Of Media Buying & Planning',
      phone: '+92 300 1234567',
      roleId: roleMap['DEPARTMENT_HEAD'].id,
      departmentId: deptMap['OPS'].id,
      teamId: teamMap['OPS-MED'].id,
      avatarUrl: '/avatars/naeem_ahmed.png',
    },
    {
      employeeId: 'EMP-0003',
      name: 'Kashif Aghani',
      email: 'kashif@apis.com',
      designation: 'Manager Business Development',
      phone: '+92 321 9876543',
      roleId: roleMap['ACCOUNT_MANAGER'].id,
      departmentId: deptMap['ACC'].id,
      teamId: teamMap['ACC-ENT'].id,
      avatarUrl: '/avatars/kashif_aghani.png',
    },
    {
      employeeId: 'EMP-0004',
      name: 'Syeda Musfira',
      email: 'musfira@apis.com',
      designation: 'Client Service & Operations Executive',
      phone: '+92 333 4567890',
      roleId: roleMap['STAFF'].id,
      departmentId: deptMap['ACC'].id,
      teamId: teamMap['ACC-ENT'].id,
      avatarUrl: '/avatars/syeda_musfira.png',
    },
    {
      employeeId: 'EMP-0005',
      name: 'Syed Abeel Ahmed',
      email: 'abeel@apis.com',
      designation: 'Head Of Design & Digital',
      phone: '+92 345 6789012',
      roleId: roleMap['DEPARTMENT_HEAD'].id,
      departmentId: deptMap['PRD'].id,
      teamId: teamMap['DSN-PRO'].id,
      avatarUrl: '/avatars/syed_abeel_ahmed.png',
    },
    {
      employeeId: 'EMP-0006',
      name: 'Adnan Karim',
      email: 'adnan@apis.com',
      designation: 'Creative Manager (AI)',
      phone: '+92 312 3456789',
      roleId: roleMap['PROJECT_MANAGER'].id,
      departmentId: deptMap['PRD'].id,
      teamId: teamMap['DSN-PRO'].id,
      avatarUrl: '/avatars/adnan_karim.png',
    },
  ];

  const userMap: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        ...u,
        passwordHash: defaultPasswordHash,
        status: 'ACTIVE',
      },
    });
    userMap[u.email] = user;
  }
  console.log('✅ Created Executive Leadership & Real Team Profiles.');

  // Set Department heads & Team leaders
  await prisma.department.update({ where: { code: 'EXEC' }, data: { headId: userMap['khurram@apis.com'].id } });
  await prisma.department.update({ where: { code: 'OPS' }, data: { headId: userMap['naeem@apis.com'].id } });
  await prisma.department.update({ where: { code: 'ACC' }, data: { headId: userMap['kashif@apis.com'].id } });
  await prisma.department.update({ where: { code: 'PRD' }, data: { headId: userMap['abeel@apis.com'].id } });
  await prisma.department.update({ where: { code: 'ENG' }, data: { headId: userMap['khurram@apis.com'].id } });
  await prisma.team.update({ where: { id: teamMap['DSN-PRO'].id }, data: { leaderId: userMap['adnan@apis.com'].id } });
  await prisma.team.update({ where: { id: teamMap['OPS-MED'].id }, data: { leaderId: userMap['naeem@apis.com'].id } });

  // 5. CLIENTS
  const clientsData = [
    {
      company: 'Apex Global Technologies',
      contactPerson: 'Marcus Vance',
      email: 'marcus@apextech.io',
      phone: '+1 (415) 890-1122',
      industry: 'Enterprise Software',
      status: 'ACTIVE',
      notes: 'Strategic tier-1 enterprise partner.',
      accountManagerId: userMap['kashif@apis.com'].id,
      address: '500 Howard St, San Francisco, CA',
    },
    {
      company: 'Horizon Telecom Group',
      contactPerson: 'Elena Rostova',
      email: 'elena.r@horizontelecom.com',
      phone: '+1 (212) 778-9900',
      industry: 'Telecommunications',
      status: 'ACTIVE',
      notes: 'Expanding nationwide 5G infrastructure management.',
      accountManagerId: userMap['kashif@apis.com'].id,
      address: '1221 Avenue of the Americas, New York, NY',
    },
    {
      company: 'Starlight Media & Broadcast',
      contactPerson: 'Julian Sterling',
      email: 'julian@starlightmedia.com',
      phone: '+1 (310) 450-8811',
      industry: 'Digital Media & AdTech',
      status: 'ACTIVE',
      notes: 'Multi-channel programmatic advertising integration.',
      accountManagerId: userMap['kashif@apis.com'].id,
      address: '8900 Wilshire Blvd, Beverly Hills, CA',
    },
    {
      company: 'Kinza Retail Corporation',
      contactPerson: 'Fatima Al-Sabah',
      email: 'fatima@kinzaretail.com',
      phone: '+971 4 399 2200',
      industry: 'Omnichannel Commerce',
      status: 'ACTIVE',
      notes: 'Regional digital transformation rollout.',
      accountManagerId: userMap['kashif@apis.com'].id,
      address: 'Dubai Media City, Building 4, Dubai, UAE',
    },
  ];

  const clientMap: Record<string, any> = {};
  for (const c of clientsData) {
    const client = await prisma.client.create({ data: c });
    clientMap[c.company] = client;
  }
  console.log('✅ Created Enterprise Clients.');

  // 6. PROJECTS
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const projectsData = [
    {
      projectCode: 'PRJ-1001',
      name: 'APIS Executive Portal & Realtime Engine',
      description: 'Unified full-stack management platform featuring rule-based risk calculations and staff capacity balancing.',
      clientId: clientMap['Apex Global Technologies'].id,
      accountManagerId: userMap['kashif@apis.com'].id,
      projectManagerId: userMap['adnan@apis.com'].id,
      departmentId: deptMap['ENG'].id,
      teamId: teamMap['ENG-CORE'].id,
      startDate: new Date(now.getTime() - 14 * dayMs),
      deadline: new Date(now.getTime() + 20 * dayMs),
      priority: 'HIGH',
      status: 'ACTIVE',
      budget: 125000,
      revenue: 165000,
      actualCost: 68000,
      progress: 65,
    },
    {
      projectCode: 'PRJ-1002',
      name: 'AdPulse Omnichannel Campaign Portal',
      description: 'High-throughput ad placement analytics with geo-spatial asset verification and OOH delivery.',
      clientId: clientMap['Starlight Media & Broadcast'].id,
      accountManagerId: userMap['kashif@apis.com'].id,
      projectManagerId: userMap['naeem@apis.com'].id,
      departmentId: deptMap['OPS'].id,
      teamId: teamMap['OPS-MED'].id,
      startDate: new Date(now.getTime() - 25 * dayMs),
      deadline: new Date(now.getTime() + 2 * dayMs), // Tight deadline! At risk!
      priority: 'URGENT',
      status: 'ACTIVE',
      budget: 95000,
      revenue: 130000,
      actualCost: 89000,
      progress: 54,
    },
    {
      projectCode: 'PRJ-1003',
      name: 'Horizon 5G Edge Network Dashboard',
      description: 'Distributed latency monitoring and telemetry analytics across metropolitan fiber hubs.',
      clientId: clientMap['Horizon Telecom Group'].id,
      accountManagerId: userMap['kashif@apis.com'].id,
      projectManagerId: userMap['adnan@apis.com'].id,
      departmentId: deptMap['ENG'].id,
      teamId: teamMap['ENG-MOB'].id,
      startDate: new Date(now.getTime() - 5 * dayMs),
      deadline: new Date(now.getTime() + 45 * dayMs),
      priority: 'MEDIUM',
      status: 'ACTIVE',
      budget: 180000,
      revenue: 240000,
      actualCost: 22000,
      progress: 25,
    },
    {
      projectCode: 'PRJ-1004',
      name: 'Kinza Global Brand & E-Commerce Overhaul',
      description: 'Headless storefront architecture with multi-currency checkout and automated catalog synchronization.',
      clientId: clientMap['Kinza Retail Corporation'].id,
      accountManagerId: userMap['kashif@apis.com'].id,
      projectManagerId: userMap['adnan@apis.com'].id,
      departmentId: deptMap['PRD'].id,
      teamId: teamMap['DSN-PRO'].id,
      startDate: new Date(now.getTime() - 40 * dayMs),
      deadline: new Date(now.getTime() - 2 * dayMs),
      priority: 'HIGH',
      status: 'COMPLETED',
      budget: 75000,
      revenue: 105000,
      actualCost: 71000,
      progress: 100,
    },
  ];

  const projectMap: Record<string, any> = {};
  for (const p of projectsData) {
    const proj = await prisma.project.create({ data: p });
    projectMap[p.projectCode] = proj;

    // Add members deduplicating userIds
    const memberUsers = [
      { userId: p.projectManagerId, role: 'LEAD' },
      { userId: userMap['naeem@apis.com'].id, role: 'MEMBER' },
      { userId: userMap['abeel@apis.com'].id, role: 'MEMBER' },
      { userId: userMap['musfira@apis.com'].id, role: 'MEMBER' },
      { userId: userMap['kashif@apis.com'].id, role: 'MEMBER' },
    ];
    const seenUsers = new Set();
    for (const m of memberUsers) {
      if (!seenUsers.has(m.userId)) {
        seenUsers.add(m.userId);
        await prisma.projectMember.create({ data: { projectId: proj.id, ...m } });
      }
    }

    // Create default conversation
    await prisma.conversation.create({
      data: {
        title: `${proj.name} Channel`,
        type: 'PROJECT',
        projectId: proj.id,
      },
    });
  }
  console.log('✅ Created Projects with Team Members.');

  // 7. MILESTONES
  const milestonesData = [
    {
      projectId: projectMap['PRJ-1001'].id,
      title: 'Phase 1: Architecture & RBAC Security Layer',
      dueDate: new Date(now.getTime() - 4 * dayMs),
      status: 'COMPLETED',
      progress: 100,
    },
    {
      projectId: projectMap['PRJ-1001'].id,
      title: 'Phase 2: Realtime Engines & API Synchronization',
      dueDate: new Date(now.getTime() + 10 * dayMs),
      status: 'IN_PROGRESS',
      progress: 60,
    },
    {
      projectId: projectMap['PRJ-1002'].id,
      title: 'Media Verification API Integration',
      dueDate: new Date(now.getTime() - 1 * dayMs), // Overdue milestone!
      status: 'PENDING',
      progress: 40,
    },
  ];

  const milestoneMap: Record<string, any> = {};
  for (const m of milestonesData) {
    const created = await prisma.milestone.create({ data: m });
    milestoneMap[m.title] = created;
  }
  console.log('✅ Created Milestones.');

  // 8. TASKS
  const tasksData = [
    // PRJ-1001 Tasks
    {
      projectId: projectMap['PRJ-1001'].id,
      taskCode: 'PRJ-1001-T001',
      title: 'Implement PostgreSQL Schema & Prisma Migrations',
      description: 'Design robust models with proper indexing, cascading rules, and foreign keys.',
      milestoneId: milestoneMap['Phase 1: Architecture & RBAC Security Layer'].id,
      assigneeId: userMap['musfira@apis.com'].id,
      reviewerId: userMap['naeem@apis.com'].id,
      priority: 'HIGH',
      status: 'COMPLETED',
      startDate: new Date(now.getTime() - 12 * dayMs),
      dueDate: new Date(now.getTime() - 6 * dayMs),
      estimatedHours: 16,
      actualHours: 14.5,
      progress: 100,
    },
    {
      projectId: projectMap['PRJ-1001'].id,
      taskCode: 'PRJ-1001-T002',
      title: 'Build Executive Risk & Intelligence Rule Engine',
      description: 'Develop algorithmic risk scoring weighing overdue tasks, timeline ratios, and workload bottlenecks.',
      milestoneId: milestoneMap['Phase 2: Realtime Engines & API Synchronization'].id,
      assigneeId: userMap['musfira@apis.com'].id,
      reviewerId: userMap['naeem@apis.com'].id,
      priority: 'URGENT',
      status: 'IN_PROGRESS',
      startDate: new Date(now.getTime() - 3 * dayMs),
      dueDate: new Date(now.getTime() + 2 * dayMs),
      estimatedHours: 20,
      actualHours: 11,
      progress: 70,
    },
    {
      projectId: projectMap['PRJ-1001'].id,
      taskCode: 'PRJ-1001-T003',
      title: 'Stitch UI Design System Preservation & Polish',
      description: 'Ensure exact layout, navigation, cards, tables, charts, and dark slate color harmony.',
      milestoneId: milestoneMap['Phase 2: Realtime Engines & API Synchronization'].id,
      assigneeId: userMap['abeel@apis.com'].id,
      reviewerId: userMap['adnan@apis.com'].id,
      priority: 'HIGH',
      status: 'IN_REVIEW',
      startDate: new Date(now.getTime() - 5 * dayMs),
      dueDate: new Date(now.getTime() + 1 * dayMs),
      estimatedHours: 18,
      actualHours: 16,
      progress: 90,
    },
    {
      projectId: projectMap['PRJ-1001'].id,
      taskCode: 'PRJ-1001-T004',
      title: 'Client Service Operations & Onboarding Flow',
      description: 'Streamline operational intake and customer satisfaction telemetry.',
      milestoneId: milestoneMap['Phase 2: Realtime Engines & API Synchronization'].id,
      assigneeId: userMap['musfira@apis.com'].id,
      reviewerId: userMap['kashif@apis.com'].id,
      priority: 'MEDIUM',
      status: 'TO_DO',
      startDate: new Date(now.getTime() - 1 * dayMs),
      dueDate: new Date(now.getTime() + 5 * dayMs),
      estimatedHours: 12,
      actualHours: 0,
      progress: 0,
    },

    // PRJ-1002 Tasks (At Risk Project with Overdue and Blocked items)
    {
      projectId: projectMap['PRJ-1002'].id,
      taskCode: 'PRJ-1002-T001',
      title: 'Resolve Media Buying Webhook DSP Latency',
      description: 'Third-party DSP networks experiencing 504 gateway timeouts on payload delivery.',
      milestoneId: milestoneMap['Media Verification API Integration'].id,
      assigneeId: userMap['naeem@apis.com'].id,
      reviewerId: userMap['adnan@apis.com'].id,
      priority: 'URGENT',
      status: 'BLOCKED',
      startDate: new Date(now.getTime() - 10 * dayMs),
      dueDate: new Date(now.getTime() - 2 * dayMs), // OVERDUE & BLOCKED!
      estimatedHours: 24,
      actualHours: 18,
      progress: 40,
    },
    {
      projectId: projectMap['PRJ-1002'].id,
      taskCode: 'PRJ-1002-T002',
      title: 'Digital Billboard Proof of Play Telemetry Ingestion',
      description: 'Aggregate photo verification logs and GPS coordinates for advertiser compliance.',
      milestoneId: milestoneMap['Media Verification API Integration'].id,
      assigneeId: userMap['adnan@apis.com'].id,
      reviewerId: userMap['naeem@apis.com'].id,
      priority: 'HIGH',
      status: 'REVISION_REQUIRED',
      startDate: new Date(now.getTime() - 8 * dayMs),
      dueDate: new Date(now.getTime() - 1 * dayMs), // OVERDUE!
      estimatedHours: 15,
      actualHours: 14,
      progress: 55,
    },
    {
      projectId: projectMap['PRJ-1002'].id,
      taskCode: 'PRJ-1002-T003',
      title: 'Campaign Pacing & Real-time Budget Burn Chart',
      description: 'Visual speedometer rendering actual impressions vs scheduled pacing targets.',
      assigneeId: userMap['musfira@apis.com'].id,
      reviewerId: userMap['naeem@apis.com'].id,
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      startDate: new Date(now.getTime() - 4 * dayMs),
      dueDate: new Date(now.getTime() + 1 * dayMs),
      estimatedHours: 10,
      actualHours: 6,
      progress: 60,
    },

    // PRJ-1003 Tasks
    {
      projectId: projectMap['PRJ-1003'].id,
      taskCode: 'PRJ-1003-T001',
      title: 'AI Creative Generation Workflow & Asset Ingestion',
      description: 'Deploy AI generative workflows for automated digital creatives.',
      assigneeId: userMap['adnan@apis.com'].id,
      reviewerId: userMap['abeel@apis.com'].id,
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      startDate: new Date(now.getTime() - 4 * dayMs),
      dueDate: new Date(now.getTime() + 8 * dayMs),
      estimatedHours: 14,
      actualHours: 4,
      progress: 30,
    },
  ];

  for (const t of tasksData) {
    const task = await prisma.task.create({
      data: t,
    });

    // Add subtasks
    await prisma.subtask.createMany({
      data: [
        { taskId: task.id, title: 'Verify unit test coverage and edge cases', isCompleted: t.progress > 50 },
        { taskId: task.id, title: 'Review pull request with tech lead', isCompleted: t.progress === 100 },
      ],
    });
  }
  console.log('✅ Created Tasks with Subtasks.');

  // Recalculate all project progress & risks
  for (const p of Object.values(projectMap)) {
    await recalculateProjectProgress(p.id);
    await calculateProjectRisk(p.id);
  }
  console.log('✅ Recalculated Project Progress and Risk Intelligence Engine.');

  // 9. TIMESHEETS
  const timesheetData = [
    {
      userId: userMap['musfira@apis.com'].id,
      projectId: projectMap['PRJ-1001'].id,
      startTime: new Date(now.getTime() - 3 * dayMs - 5 * 3600 * 1000),
      endTime: new Date(now.getTime() - 3 * dayMs),
      breakMinutes: 30,
      totalDurationMinutes: 270,
      isRunning: false,
      date: new Date(now.getTime() - 3 * dayMs),
      notes: 'Client onboarding workflows and intake process automation.',
      status: 'APPROVED',
    },
    {
      userId: userMap['naeem@apis.com'].id,
      projectId: projectMap['PRJ-1002'].id,
      startTime: new Date(now.getTime() - 1 * dayMs - 6 * 3600 * 1000),
      endTime: new Date(now.getTime() - 1 * dayMs),
      breakMinutes: 45,
      totalDurationMinutes: 315,
      isRunning: false,
      date: new Date(now.getTime() - 1 * dayMs),
      notes: 'Media planning rate optimization and pacing schedules.',
      status: 'APPROVED',
    },
    {
      userId: userMap['adnan@apis.com'].id,
      projectId: projectMap['PRJ-1002'].id,
      startTime: new Date(now.getTime() - 2 * dayMs - 4 * 3600 * 1000),
      endTime: new Date(now.getTime() - 2 * dayMs),
      breakMinutes: 15,
      totalDurationMinutes: 225,
      isRunning: false,
      date: new Date(now.getTime() - 2 * dayMs),
      notes: 'Creative AI prompt iteration and layout variations.',
      status: 'SUBMITTED',
    },
  ];

  for (const ts of timesheetData) {
    await prisma.timesheet.create({ data: ts });
  }
  console.log('✅ Created Timesheet records.');

  // 10. CEO ANNOUNCEMENTS
  const announcement = await prisma.announcement.create({
    data: {
      title: 'Q3 Enterprise Project Delivery & Executive Review',
      message: 'All department leads and project managers are requested to review high-risk projects ahead of Friday board presentation. Ensure all timesheets and task blockers are updated.',
      priority: 'HIGH',
      audience: 'EVERYONE',
      senderId: userMap['khurram@apis.com'].id,
    },
  });

  // Create receipts for all staff
  for (const u of Object.values(userMap)) {
    await prisma.announcementReceipt.create({
      data: {
        announcementId: announcement.id,
        userId: u.id,
        isRead: u.email === 'khurram@apis.com' || u.email === 'adnan@apis.com',
        isAcknowledged: u.email === 'adnan@apis.com',
      },
    });
  }
  console.log('✅ Created CEO Announcements with Receipts.');

  // 11. NOTIFICATIONS
  await prisma.notification.createMany({
    data: [
      {
        userId: userMap['musfira@apis.com'].id,
        type: 'TASK_ASSIGNED',
        title: 'New High Priority Task',
        message: 'You have been assigned: Client Service Operations & Onboarding Flow.',
        link: '/tasks',
        isRead: false,
      },
      {
        userId: userMap['naeem@apis.com'].id,
        type: 'PROJECT_RISK',
        title: 'Critical Risk Alert: AdPulse Campaign Portal',
        message: 'Risk Engine detected 2 overdue tasks and deadline in 2 days.',
        link: `/projects/${projectMap['PRJ-1002'].id}`,
        isRead: false,
      },
      {
        userId: userMap['adnan@apis.com'].id,
        type: 'APPROVAL_REQUIRED',
        title: 'Task Revision Requested',
        message: 'Task "Digital Billboard Proof of Play Telemetry Ingestion" requires revision.',
        link: '/tasks',
        isRead: false,
      },
      {
        userId: userMap['khurram@apis.com'].id,
        type: 'APPROVAL_REQUIRED',
        title: 'Pending Milestone Approvals',
        message: '2 timesheet and budget adjustment requests awaiting executive sign-off.',
        link: '/approvals',
        isRead: false,
      },
    ],
  });
  console.log('✅ Created Notifications.');

  // 12. APPROVALS
  await prisma.approval.createMany({
    data: [
      {
        entityType: 'PROJECT',
        entityId: projectMap['PRJ-1001'].id,
        requesterId: userMap['adnan@apis.com'].id,
        approverId: userMap['khurram@apis.com'].id,
        status: 'APPROVED',
        comments: 'Architecture plan approved with green light for sprint execution.',
        projectId: projectMap['PRJ-1001'].id,
        decisionAt: new Date(),
      },
      {
        entityType: 'TASK',
        entityId: tasksData[2].taskCode,
        requesterId: userMap['abeel@apis.com'].id,
        approverId: userMap['adnan@apis.com'].id,
        status: 'SUBMITTED',
        comments: 'Ready for final visual design QA.',
        projectId: projectMap['PRJ-1001'].id,
      },
    ],
  });
  console.log('✅ Created Approvals.');

  // 13. DOCUMENTS
  await prisma.document.create({
    data: {
      title: 'APIS System Architecture Specification v2.4.pdf',
      fileName: 'APIS_Architecture_Spec.pdf',
      fileUrl: '/uploads/sample_spec.pdf',
      fileType: 'pdf',
      fileSize: 2450000,
      category: 'PROJECT',
      uploaderId: userMap['musfira@apis.com'].id,
      projectId: projectMap['PRJ-1001'].id,
      versions: {
        create: {
          versionNumber: 1,
          fileName: 'APIS_Architecture_Spec.pdf',
          fileUrl: '/uploads/sample_spec.pdf',
          fileSize: 2450000,
          changeSummary: 'Initial architecture blueprint',
        },
      },
    },
  });
  console.log('✅ Created Documents.');

  // 14. ACTIVITY LOGS
  const activities = [
    { userId: userMap['khurram@apis.com'].id, action: 'CEO_ANNOUNCEMENT_CREATED', entity: 'ANNOUNCEMENT', entityId: announcement.id, metadata: { title: announcement.title } },
    { userId: userMap['adnan@apis.com'].id, action: 'PROJECT_CREATED', entity: 'PROJECT', entityId: projectMap['PRJ-1001'].id, metadata: { name: 'APIS Executive Portal' } },
    { userId: userMap['musfira@apis.com'].id, action: 'TASK_STATUS_CHANGED', entity: 'TASK', entityId: tasksData[0].taskCode, metadata: { status: 'COMPLETED' } },
    { userId: userMap['naeem@apis.com'].id, action: 'TIMESHEET_STARTED', entity: 'TIMESHEET', entityId: 'TS-001', metadata: { project: 'AdPulse' } },
  ];

  for (const a of activities) {
    await prisma.activityLog.create({
      data: {
        userId: a.userId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        metadata: JSON.stringify(a.metadata),
      },
    });
  }
  console.log('✅ Created Activity Audit Logs.');

  console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
  console.log('APIS EXECUTIVE LEADERSHIP & TEAM (Password: password123):');
  console.log('👑 Khurram Jaffrani:   khurram@apis.com (Chief Executive Officer / CEO)');
  console.log('🌟 Naeem Ahmed:        naeem@apis.com   (Head Of Media Buying & Planning)');
  console.log('🌟 Kashif Aghani:      kashif@apis.com  (Manager Business Development)');
  console.log('🌟 Syeda Musfira:      musfira@apis.com (Client Service & Operations Executive)');
  console.log('🌟 Syed Abeel Ahmed:   abeel@apis.com   (Head Of Design & Digital)');
  console.log('🌟 Adnan Karim:        adnan@apis.com   (Creative Manager AI / PM)');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
