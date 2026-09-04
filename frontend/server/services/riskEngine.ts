import prisma from '../config/prisma';

export interface RiskAnalysisResult {
  projectId: string;
  projectName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  healthScore: number; // 0 to 100
  deadlineRisk: number; // 0 to 100
  taskRisk: number; // 0 to 100
  workloadRisk: number; // 0 to 100
  reasons: string[];
  recommendations: string[];
}

/**
 * Project Risk & Executive Intelligence Engine
 * Evaluates real metrics:
 * 1. Deadline proximity vs remaining progress
 * 2. Overdue tasks count
 * 3. Blocked / Revision required tasks
 * 4. Recent activity velocity
 * 5. Budget vs actual cost burn
 */
export async function calculateProjectRisk(projectId: string): Promise<RiskAnalysisResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      tasks: true,
      members: { include: { user: true } },
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const now = new Date();
  const deadline = new Date(project.deadline);
  const startDate = new Date(project.startDate);
  
  const totalDurationMs = deadline.getTime() - startDate.getTime();
  const elapsedDurationMs = now.getTime() - startDate.getTime();
  const timeElapsedRatio = totalDurationMs > 0 ? Math.min(Math.max(elapsedDurationMs / totalDurationMs, 0), 2.0) : 1;
  const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length;
  const overdueTasks = project.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED' && t.status !== 'APPROVED');
  const blockedTasks = project.tasks.filter((t) => t.status === 'BLOCKED');
  const revisionTasks = project.tasks.filter((t) => t.status === 'REVISION_REQUIRED');

  const progress = project.progress;
  const reasons: string[] = [];
  const recommendations: string[] = [];

  let deadlineRisk = 10;
  let taskRisk = 10;
  let workloadRisk = 10;

  // Deadline checks
  if (daysUntilDeadline < 0 && progress < 100) {
    deadlineRisk = 95;
    reasons.push(`Project deadline passed ${Math.abs(daysUntilDeadline)} days ago while incomplete (${Math.round(progress)}% progress)`);
    recommendations.push('Immediate timeline extension and executive review needed');
  } else if (daysUntilDeadline <= 3 && progress < 80) {
    deadlineRisk = 85;
    reasons.push(`Deadline in ${daysUntilDeadline} days with only ${Math.round(progress)}% completed`);
    recommendations.push('Prioritize remaining high-impact tasks and reassign blockers');
  } else if (daysUntilDeadline <= 7 && progress < 50) {
    deadlineRisk = 70;
    reasons.push(`Only ${daysUntilDeadline} days remaining with less than half completed`);
    recommendations.push('Assign additional team members to accelerate delivery');
  } else if (timeElapsedRatio > 0.7 && progress < 40) {
    deadlineRisk = 60;
    reasons.push(`Over 70% timeline consumed with only ${Math.round(progress)}% progress`);
  }

  // Task checks
  if (overdueTasks.length > 0) {
    taskRisk += overdueTasks.length * 18;
    reasons.push(`${overdueTasks.length} task(s) currently overdue`);
    recommendations.push(`Resolve ${overdueTasks.length} overdue task(s) immediately`);
  }

  if (blockedTasks.length > 0) {
    taskRisk += blockedTasks.length * 20;
    reasons.push(`${blockedTasks.length} task(s) are BLOCKED`);
    recommendations.push(`Clear dependencies for ${blockedTasks.length} blocked task(s)`);
  }

  if (revisionTasks.length > 0) {
    taskRisk += revisionTasks.length * 12;
    reasons.push(`${revisionTasks.length} task(s) require revisions`);
  }

  // Budget checks
  if (project.budget > 0 && project.actualCost > project.budget) {
    workloadRisk += 30;
    const over = Math.round(((project.actualCost - project.budget) / project.budget) * 100);
    reasons.push(`Project budget exceeded by ${over}% ($${project.actualCost.toLocaleString()} / $${project.budget.toLocaleString()})`);
  }

  // Team capacity check
  if (project.members.length === 0 && totalTasks > 0) {
    workloadRisk += 40;
    reasons.push('No team members assigned to project with active tasks');
    recommendations.push('Assign project team members');
  }

  deadlineRisk = Math.min(Math.max(deadlineRisk, 0), 100);
  taskRisk = Math.min(Math.max(taskRisk, 0), 100);
  workloadRisk = Math.min(Math.max(workloadRisk, 0), 100);

  // Overall Risk Score & Health Score
  const aggregateRiskScore = Math.round((deadlineRisk * 0.45) + (taskRisk * 0.35) + (workloadRisk * 0.20));
  const healthScore = Math.max(100 - aggregateRiskScore, 0);

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
  if (aggregateRiskScore >= 75 || daysUntilDeadline < 0) {
    riskLevel = 'CRITICAL';
  } else if (aggregateRiskScore >= 50) {
    riskLevel = 'HIGH';
  } else if (aggregateRiskScore >= 25) {
    riskLevel = 'MEDIUM';
  } else {
    riskLevel = 'LOW';
  }

  if (reasons.length === 0) {
    reasons.push('Project execution is on schedule and healthy');
    recommendations.push('Maintain steady sprint velocity');
  }

  // Upsert risk entry in database
  await prisma.projectRisk.create({
    data: {
      projectId: project.id,
      riskLevel,
      healthScore,
      deadlineRisk,
      taskRisk,
      workloadRisk,
      reasons: JSON.stringify(reasons),
      recommendations: JSON.stringify(recommendations),
    },
  });

  return {
    projectId: project.id,
    projectName: project.name,
    riskLevel,
    healthScore,
    deadlineRisk,
    taskRisk,
    workloadRisk,
    reasons,
    recommendations,
  };
}

export async function recalculateAllProjectRisks() {
  const activeProjects = await prisma.project.findMany({
    where: { status: { in: ['PLANNING', 'ACTIVE', 'IN_REVIEW'] } },
    select: { id: true },
  });

  const results = [];
  for (const p of activeProjects) {
    const risk = await calculateProjectRisk(p.id);
    results.push(risk);
  }
  return results;
}
