import prisma from '../config/prisma';
import { logActivity } from './activityLogService';

export interface CreateDocumentInput {
  title: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category?: string;
  projectId?: string;
  taskId?: string;
  clientId?: string;
  uploaderId: string;
}

export async function createDocument(data: CreateDocumentInput) {
  const document = await prisma.document.create({
    data: {
      title: data.title,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileType: data.fileType,
      fileSize: data.fileSize,
      category: data.category || 'PROJECT',
      projectId: data.projectId,
      taskId: data.taskId,
      clientId: data.clientId,
      uploaderId: data.uploaderId,
      versions: {
        create: {
          versionNumber: 1,
          fileName: data.fileName,
          fileUrl: data.fileUrl,
          fileSize: data.fileSize,
          changeSummary: 'Initial upload',
        },
      },
    },
    include: {
      uploader: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true } },
      task: { select: { id: true, title: true } },
      versions: true,
    },
  });

  await logActivity({
    userId: data.uploaderId,
    action: 'DOCUMENT_UPLOADED',
    entity: 'DOCUMENT',
    entityId: document.id,
    metadata: { title: document.title, fileName: document.fileName },
  });

  return document;
}

export async function addDocumentVersion(
  documentId: string,
  fileData: { fileName: string; fileUrl: string; fileSize: number; changeSummary?: string },
  uploaderId: string
) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });

  if (!doc) throw new Error('Document not found');

  const nextVersion = (doc.versions[0]?.versionNumber || 1) + 1;

  const version = await prisma.documentVersion.create({
    data: {
      documentId,
      versionNumber: nextVersion,
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
      changeSummary: fileData.changeSummary || `Updated to version ${nextVersion}`,
    },
  });

  // Update main document latest url and filename
  await prisma.document.update({
    where: { id: documentId },
    data: {
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
    },
  });

  await logActivity({
    userId: uploaderId,
    action: 'DOCUMENT_VERSION_ADDED',
    entity: 'DOCUMENT',
    entityId: documentId,
    metadata: { version: nextVersion },
  });

  return version;
}

export async function getDocuments(filters: {
  category?: string;
  projectId?: string;
  taskId?: string;
  clientId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};
  if (filters.category) where.category = filters.category;
  if (filters.projectId) where.projectId = filters.projectId;
  if (filters.taskId) where.taskId = filters.taskId;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search } },
      { fileName: { contains: filters.search } },
    ];
  }

  const [documents, total] = await Promise.all([
    prisma.document.findMany({
      where,
      include: {
        uploader: { select: { id: true, name: true, avatarUrl: true } },
        project: { select: { id: true, name: true, projectCode: true } },
        task: { select: { id: true, title: true } },
        client: { select: { id: true, company: true } },
        versions: { orderBy: { versionNumber: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.document.count({ where }),
  ]);

  return { documents, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function deleteDocument(id: string, actorUserId: string) {
  const deleted = await prisma.document.delete({ where: { id } });
  await logActivity({
    userId: actorUserId,
    action: 'DOCUMENT_DELETED',
    entity: 'DOCUMENT',
    entityId: id,
    metadata: { title: deleted.title },
  });
  return deleted;
}
