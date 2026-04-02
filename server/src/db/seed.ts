import { db } from './index.js';
import { users, appointments, userUnits } from './schema.js';
import type { InferInsertModel } from 'drizzle-orm';

async function seed() {
  console.log('Starting safe seeding process...');

  const teamData = [
    { email: 'premkiran.polepalli@slu.edu', fullName: 'Prem Kiran', role: 'Admin' as const, unitId: 'MATH-DEPT-2026' },
    { email: 'darcy.mupenda@slu.edu', fullName: 'Darcy Mupenda', role: 'GA' as const, unitId: null },
    { email: 'elizabeth.dreste@slu.edu', fullName: 'Elizabeth Dreste', role: 'GA' as const, unitId: null },
    { email: 'daniel.shown@slu.edu', fullName: 'Daniel Shown', role: 'Mentor' as const, unitId: 'MATH-DEPT-2026' },
    { email: 'sritammiraja.iragavarapu@slu.edu', fullName: 'Sritammiraja Iragavarapu', role: 'Mentor' as const, unitId: 'CS-DEPT-2026' }
  ];

  // 1. Seed/Update Users
  for (const user of teamData) {
    await db.insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.email,
        set: { fullName: user.fullName, role: user.role, unitId: user.unitId }
      });
  }

  const allUsers = await db.select().from(users);
  const findUser = (email: string) => allUsers.find(u => u.email === email);

  const prem = findUser('premkiran.polepalli@slu.edu');
  const darcy = findUser('darcy.mupenda@slu.edu');
  const elizabeth = findUser('elizabeth.dreste@slu.edu');
  const daniel = findUser('daniel.shown@slu.edu');
  const sritam = findUser('sritammiraja.iragavarapu@slu.edu');

  type NewAppointment = InferInsertModel<typeof appointments>;

  if (prem && darcy && elizabeth && daniel && sritam) {
    const unitAssignments = [
      { userId: darcy.id, unitId: 'CS-DEPT-2026' },
      { userId: darcy.id, unitId: 'MATH-DEPT-2026' },
      { userId: elizabeth.id, unitId: 'MATH-DEPT-2026' },
      { userId: elizabeth.id, unitId: 'CS-DEPT-2026' },
    ];

    for (const assignment of unitAssignments) {
      await db.insert(userUnits).values(assignment).onConflictDoNothing();
    }

    // Define your data with 'as const' to satisfy the strict enum types
    const appointmentData : NewAppointment[] = [
      {
        gaId: darcy.id,
        mentorId: sritam.id,
        unitId: 'CS-DEPT-2026',
        status: 'AwaitingExpectationSetting' as const, 
        expectationData: {} as any,
        midYearData: {} as any,
        finalEvaluationData: {} as any
      },
      {
        gaId: elizabeth.id,
        mentorId: daniel.id,
        unitId: 'MATH-DEPT-2026',
        status: 'ExpectationSet' as const,
        expectationData: {
          goals: ["Master React Query", "Implement Zod Validation"],
          weeklyHours: 20,
          responsibilities: "Lead frontend development for the GradEval project."
        },
        midYearData: {} as any,
        finalEvaluationData: {} as any
      },
      {
        gaId: darcy.id,
        mentorId: sritam.id,
        unitId: 'CS-DEPT-2026',
        status: 'MidYearCompleted' as const,
        expectationData: { goals: ["Research Assistance"], weeklyHours: 15 },
        midYearData: { 
          performance: "Exceeding expectations", 
          feedback: "Great progress on data collection." 
        },
        finalEvaluationData: {} as any
      },
      {
        gaId: elizabeth.id,
        mentorId: daniel.id,
        unitId: 'MATH-DEPT-2026',
        status: 'FinalEvaluated' as const,
        expectationData: { goals: ["Lab Maintenance"] },
        midYearData: { performance: "Satisfactory" },
        finalEvaluationData: { 
          grade: "A", 
          summary: "Completed all lab duties with high precision." 
        }
      }
    ];

    // 3. Seed Appointments
    for (const appt of appointmentData) {
      await db.insert(appointments)
        .values(appt)
        .onConflictDoNothing();
    }
  }

  console.log('Seeding complete! Database is in sync.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
