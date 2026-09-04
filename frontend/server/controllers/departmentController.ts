import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { sendSuccess, sendError } from '../utils/response';

export async function getDepartments(req: AuthenticatedRequest, res: Response) {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: { select: { id: true, name: true, avatarUrl: true } },
        teams: {
          include: {
            leader: { select: { id: true, name: true, avatarUrl: true } },
            members: { select: { id: true, name: true, avatarUrl: true, designation: true } },
          },
        },
        users: { select: { id: true, name: true, designation: true, avatarUrl: true } },
        _count: { select: { projects: true, users: true } },
      },
    });
    return sendSuccess(res, departments);
  } catch (error: any) {
    return sendError(res, error.message, 500);
  }
}

export async function createDepartment(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, code, description, headId } = req.body;
    const department = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description, headId },
    });
    return sendSuccess(res, department, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}

export async function createTeam(req: AuthenticatedRequest, res: Response) {
  try {
    const { name, code, description, departmentId, leaderId } = req.body;
    const team = await prisma.team.create({
      data: { name, code, description, departmentId, leaderId },
    });
    return sendSuccess(res, team, 201);
  } catch (error: any) {
    return sendError(res, error.message, 400);
  }
}
