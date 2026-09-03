import prisma from '../config/prisma';

export async function searchAllEntities(query: string, limit = 10) {
  if (!query || query.trim().length === 0) {
    return { projects: [], tasks: [], users: [], clients: [], documents: [] };
  }

  const cleanQuery = query.trim();

  const [projects, tasks, users, clients, documents] = await Promise.all([
    prisma.project.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery } },
          { projectCode: { contains: cleanQuery } },
          { description: { contains: cleanQuery } },
        ],
      },
      select: {
        id: true,
        name: true,
        projectCode: true,
        status: true,
        priority: true,
        progress: true,
      },
      take: limit,
    }),
    prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: cleanQuery } },
          { taskCode: { contains: cleanQuery } },
          { description: { contains: cleanQuery } },
        ],
      },
      select: {
        id: true,
        title: true,
        taskCode: true,
        status: true,
        priority: true,
        projectId: true,
        project: { select: { name: true } },
      },
      take: limit,
    }),
    prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: cleanQuery } },
          { email: { contains: cleanQuery } },
          { employeeId: { contains: cleanQuery } },
          { designation: { contains: cleanQuery } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        designation: true,
        avatarUrl: true,
        role: { select: { name: true } },
      },
      take: limit,
    }),
    prisma.client.findMany({
      where: {
        OR: [
          { company: { contains: cleanQuery } },
          { contactPerson: { contains: cleanQuery } },
          { email: { contains: cleanQuery } },
          { industry: { contains: cleanQuery } },
        ],
      },
      select: {
        id: true,
        company: true,
        contactPerson: true,
        email: true,
        status: true,
      },
      take: limit,
    }),
    prisma.document.findMany({
      where: {
        OR: [
          { title: { contains: cleanQuery } },
          { fileName: { contains: cleanQuery } },
        ],
      },
      select: {
        id: true,
        title: true,
        fileName: true,
        fileType: true,
        fileUrl: true,
      },
      take: limit,
    }),
  ]);

  return {
    projects,
    tasks,
    users,
    clients,
    documents,
    totalCount: projects.length + tasks.length + users.length + clients.length + documents.length,
  };
}
