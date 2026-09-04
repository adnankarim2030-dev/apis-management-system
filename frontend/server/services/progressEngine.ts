import prisma from '../config/prisma';
import { calculateProjectRisk } from './riskEngine';

/**
 * Dynamic Project Progress Engine
 * Calculates progress = (completed tasks / total tasks) * 100
 * Or average task progress if partial percentages are used.
 * Automatically triggers Risk Engine recalculation when progress updates.
 */
export async function recalculateProjectProgress(projectId: string): Promise<number> {
  const tasks = await prisma.task.findMany({
    where: { projectId },
    select: {
      id: true,
      status: true,
      progress: true,
      estimatedHours: true,
    },
  });

  if (tasks.length === 0) {
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: 0 },
    });
    return 0;
  }

  let totalWeight = 0;
  let accumulatedProgress = 0;

  for (const task of tasks) {
    const weight = task.estimatedHours > 0 ? task.estimatedHours : 1;
    totalWeight += weight;

    if (task.status === 'COMPLETED' || task.status === 'APPROVED') {
      accumulatedProgress += 100 * weight;
    } else if (task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW') {
      accumulatedProgress += Math.max(task.progress, 30) * weight;
    } else if (task.status === 'REVISION_REQUIRED') {
      accumulatedProgress += 20 * weight;
    } else {
      accumulatedProgress += (task.progress || 0) * weight;
    }
  }

  const finalProgress = Math.min(Math.max(Math.round(accumulatedProgress / totalWeight), 0), 100);

  // Update project progress
  await prisma.project.update({
    where: { id: projectId },
    data: {
      progress: finalProgress,
      status: finalProgress === 100 ? 'COMPLETED' : undefined,
    },
  });

  // Automatically recalculate project risk in background
  try {
    await calculateProjectRisk(projectId);
  } catch (err) {
    console.error(`Failed to refresh risk for project ${projectId}:`, err);
  }

  return finalProgress;
}
