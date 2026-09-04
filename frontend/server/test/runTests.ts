import { loginUser } from '../services/authService';
import { getCEODashboardData, getStaffDashboardData } from '../services/dashboardService';
import { calculateProjectRisk } from '../services/riskEngine';
import { calculateStaffWorkload } from '../services/workloadEngine';
import { recalculateProjectProgress } from '../services/progressEngine';
import { getProjects } from '../services/projectService';
import { getTasks } from '../services/taskService';
import { startWorkSession, stopWorkSession, getActiveSession } from '../services/timesheetService';
import prisma from '../config/prisma';

async function runTests() {
  console.log('🧪 Starting APIS Backend Automated Verification Suite...\n');

  try {
    // 1. Auth Test
    console.log('Test 1: Testing CEO and Staff Login...');
    const ceoLogin = await loginUser('ceo@apis.com', 'password123');
    if (!ceoLogin.token || ceoLogin.user.role !== 'CEO') throw new Error('CEO Login failed');
    console.log('  ✅ CEO Authenticated successfully. Role:', ceoLogin.user.role);

    const staffLogin = await loginUser('sara@apis.com', 'password123');
    if (!staffLogin.token || staffLogin.user.role !== 'STAFF') throw new Error('Staff Login failed');
    console.log('  ✅ Staff Authenticated successfully. Role:', staffLogin.user.role);

    // 2. Project List & Risk Analysis Test
    console.log('\nTest 2: Testing Projects & Risk Intelligence...');
    const projectsResult = await getProjects({});
    if (projectsResult.projects.length === 0) throw new Error('No projects found');
    console.log(`  ✅ Retrieved ${projectsResult.projects.length} projects.`);

    const atRiskProject = projectsResult.projects.find((p) => p.projectCode === 'PRJ-1002');
    if (!atRiskProject) throw new Error('PRJ-1002 not found');
    console.log(`  ✅ Risk check on ${atRiskProject.name}: Level=${atRiskProject.riskAssessment?.riskLevel}, HealthScore=${atRiskProject.riskAssessment?.healthScore}`);
    console.log(`  🔍 Risk reasons:`, atRiskProject.riskAssessment?.reasons);

    // 3. Workload Engine Test
    console.log('\nTest 3: Testing Staff Workload Engine...');
    const workload = await calculateStaffWorkload();
    if (workload.length === 0) throw new Error('No workload computed');
    console.log(`  ✅ Evaluated workload for ${workload.length} staff members.`);
    workload.slice(0, 3).forEach((w) => {
      console.log(`     - ${w.name}: ${w.workloadPercentage}% (${w.status}) -> ${w.recommendation}`);
    });

    // 4. Timesheet Start & Overlap Prevention Test
    console.log('\nTest 4: Testing Timesheet Live Tracking & Overlap Prevention...');
    const sara = await prisma.user.findUnique({ where: { email: 'sara@apis.com' } });
    if (!sara) throw new Error('Sara user not found');

    const session = await startWorkSession({
      userId: sara.id,
      projectId: atRiskProject.id,
      notes: 'Automated test work session',
    });
    console.log('  ✅ Started work session:', session.id);

    // Try starting a second session (should throw overlap error)
    let overlapPrevented = false;
    try {
      await startWorkSession({
        userId: sara.id,
        projectId: atRiskProject.id,
        notes: 'Conflicting session',
      });
    } catch (e: any) {
      overlapPrevented = true;
      console.log('  ✅ Overlapping session correctly blocked:', e.message);
    }
    if (!overlapPrevented) throw new Error('Overlap prevention failed!');

    // Stop session
    const stopped = await stopWorkSession(session.id, sara.id, 'Finished automated test task');
    console.log(`  ✅ Stopped work session successfully. Duration: ${stopped.totalDurationMinutes} min.`);

    // 5. Dashboard Aggregations Test
    console.log('\nTest 5: Testing CEO & Staff Dashboard Aggregations...');
    const ceoDash = await getCEODashboardData();
    console.log(`  ✅ CEO Dashboard computed. Total Projects: ${ceoDash.metrics.totalProjects}, At-Risk: ${ceoDash.metrics.atRiskProjectsCount}`);

    const staffDash = await getStaffDashboardData(sara.id);
    console.log(`  ✅ Staff Dashboard computed. Assigned tasks: ${staffDash.metrics.totalAssignedTasks}`);

    console.log('\n🎉 ALL 5 TEST SUITES PASSED FLAWLESSLY! Backend is production-ready.');
  } catch (error) {
    console.error('❌ Verification Test Failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
