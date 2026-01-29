import { db } from './index.js';
import { users, appointments } from './schema.js';

async function seed() {
  console.log('Starting safe seeding process...');

  const teamData = [
    { email: 'premkiran.polepalli@slu.edu', fullName: 'Prem Kiran', role: 'Admin' as const},
    { email: 'darcy.mupenda@slu.edu', fullName: 'Darcy Mupenda', role: 'GA' as const},
    { email: 'elizabeth.dreste@slu.edu', fullName: 'Elizabeth Dreste', role: 'GA' as const},
    { email: 'daniel.shown@slu.edu', fullName: 'Daniel Shown', role: 'Mentor' as const},
    { email: 'sritammiraja.iragavarapu@slu.edu', fullName: 'Sritammiraja Iragavarapu', role: 'Mentor' as const}
  ];

  // 1. Seed/Update Users
  for (const user of teamData) {
    await db.insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.email,
        set: { fullName: user.fullName, role: user.role }
      });
  }

  const allUsers = await db.select().from(users);
  const findUser = (email: string) => allUsers.find(u => u.email === email);

  const prem = findUser('premkiran.polepalli@slu.edu');
  const darcy = findUser('darcy.mupenda@slu.edu');
  const elizabeth = findUser('elizabeth.dreste@slu.edu');
  const daniel = findUser('daniel.shown@slu.edu');
  const sritam = findUser('sritammiraja.iragavarapu@slu.edu');

  if (prem && darcy && elizabeth && daniel && sritam) {
    // Define your data with 'as const' to satisfy the strict enum types
    const appointmentData = [
      {
        gaId: darcy.id,
        mentorId: daniel.id,
        unitId: 'CS-DEPT-2026',
        status: 'AwaitingExpectationSetting' as const, 
        data: {}
      },
      {
        gaId: elizabeth.id,
        mentorId: prem.id,
        unitId: 'MATH-DEPT-2026',
        status: 'ExpectationSet' as const,
        data: {
          expectations: {
            goals: ["Master React Query", "Implement Zod Validation"],
            weeklyHours: 20,
            responsibilities: "Lead frontend development for the GradEval project."
          }
        }
      },
      {
        gaId: darcy.id,
        mentorId: sritam.id,
        unitId: 'BIO-DEPT-2026',
        status: 'MidYearCompleted' as const,
        data: {
          expectations: { goals: ["Research Assistance"], weeklyHours: 15 },
          midYear: { 
            performance: "Exceeding expectations", 
            feedback: "Great progress on data collection." 
          }
        }
      },
      {
        gaId: elizabeth.id,
        mentorId: daniel.id,
        unitId: 'PHYS-DEPT-2026',
        status: 'FinalEvaluated' as const,
        data: {
          expectations: { goals: ["Lab Maintenance"] },
          midYear: { performance: "Satisfactory" },
          final: { 
            grade: "A", 
            summary: "Completed all lab duties with high precision." 
          }
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