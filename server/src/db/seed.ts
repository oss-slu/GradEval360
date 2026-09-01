import { db } from './index.js';
import { users, appointments, userUnits } from './schema.js';
import type { InferInsertModel } from 'drizzle-orm';
import { generateAppointmentCode } from "../lib/appointment-code.js";

async function seed() {
  console.log('Starting safe seeding process...');

  const teamData = [
    { email: 'mentorA@slu.edu', fullName: 'Mentor A', role: 'Mentor' as const, unitId: 'UNIT-A' },
    { email: 'mentorB@slu.edu', fullName: 'Mentor B', role: 'Mentor' as const, unitId: 'UNIT-B' },
    { email: 'gaA@slu.edu', fullName: 'GA A', role: 'GA' as const, unitId: null },
    { email: 'gaB@slu.edu', fullName: 'GA B', role: 'GA' as const, unitId: null },
    { email: 'gaC@slu.edu', fullName: 'GA C', role: 'GA' as const, unitId: null },
    { email: 'gaD@slu.edu', fullName: 'GA D', role: 'GA' as const, unitId: null },
    { email: 'bott003@slu.edu', fullName: 'Bella Ott', role: 'Admin' as const, unitId: 'UNIT-A' },
    { email: 'david.pan@slu.edu', fullName: 'David Pan', role: 'Admin' as const, unitId: 'UNIT-B' },
    { email: 'melody.neimeyer@slu.edu', fullName: 'Melody Neimeyer', role: 'Admin' as const, unitId: 'UNIT-A' },
    { email: 'jada.harvey.1@slu.edu', fullName: 'Jada Harvey', role: 'Admin' as const, unitId: 'UNIT-B' },
  ].map((user) => ({
    ...user,
    email: user.email.toLowerCase(),
  }));

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

  const mentorA = findUser('mentorA@slu.edu'.toLowerCase());
  const mentorB = findUser('mentorB@slu.edu'.toLowerCase());
  const gaA = findUser('gaA@slu.edu'.toLowerCase());
  const gaB = findUser('gaB@slu.edu'.toLowerCase());
  const gaC = findUser('gaC@slu.edu'.toLowerCase());
  const gaD = findUser('gaD@slu.edu'.toLowerCase());
  const bella = findUser('bott003@slu.edu');
  const david = findUser('david.pan@slu.edu');
  const melody = findUser('melody.neimeyer@slu.edu');
  const jada = findUser('jada.harvey.1@slu.edu');

  type NewAppointment = InferInsertModel<typeof appointments>;

  if (mentorA && mentorB && gaA && gaB && gaC && gaD && bella && david && melody && jada) {
    const unitAssignments = [
      { userId: gaA.id, unitId: 'UNIT-A' },
      { userId: gaA.id, unitId: 'UNIT-B' },
      { userId: gaB.id, unitId: 'UNIT-A' },
      { userId: gaC.id, unitId: 'UNIT-B' },
      { userId: gaD.id, unitId: 'UNIT-A' },
      { userId: gaD.id, unitId: 'UNIT-B' },
    ];

    for (const assignment of unitAssignments) {
      await db.insert(userUnits).values(assignment).onConflictDoNothing();
    }

    const appointmentData : NewAppointment[] = [
      {
        gaId: gaA.id,
        mentorId: mentorA.id,
        unitId: 'UNIT-A',
        status: 'AwaitingExpectationSetting' as const, 
        appointmentCode: generateAppointmentCode(),
        expectationData: {} as any,
        selfEvaluationData: {} as any,
        mentorEvaluationData: {} as any
      },
      {
        gaId: gaA.id,
        mentorId: mentorB.id,
        unitId: 'UNIT-B',
        status: 'ExpectationSet' as const,
        appointmentCode: generateAppointmentCode(),
        expectationData: {
          mentorGoals: ["Master React Query", "Implement Zod Validation"],
          goals: ["Master React Query", "Implement Zod Validation"],
          weeklyHours: 20,
          responsibilities: "Lead frontend development for the GradEval project.",
          mentorNotes: "Focus on schema alignment and data validation.",
          gaAcknowledged: true,
          gaAcknowledgedAt: "2026-03-10"
        },
        selfEvaluationData: {} as any,
        mentorEvaluationData: {} as any
      },
      {
        gaId: gaB.id,
        mentorId: mentorA.id,
        unitId: 'UNIT-A',
        status: 'SelfEvaluationCompleted' as const,
        appointmentCode: generateAppointmentCode(),
        expectationData: { 
          goals: ["Research Assistance"], 
          mentorGoals: ["Research Assistance"],
          weeklyHours: 15, 
          responsibilities: "Support data collection and analysis." 
        },
        selfEvaluationData: { 
          goalProgress: "Completed initial data collection and started analysis.",
          strengths: "Consistent communication and data accuracy.",
          challenges: "Time management during peak weeks."
        },
        mentorEvaluationData: {} as any
      },
      {
        gaId: gaC.id,
        mentorId: mentorB.id,
        unitId: 'UNIT-B',
        status: 'AwaitingSignOff' as const,
        appointmentCode: generateAppointmentCode(),
        expectationData: { goals: ["Lab Maintenance"], mentorGoals: ["Lab Maintenance"] },
        selfEvaluationData: { 
          goalProgress: "Resolved maintenance backlog and improved documentation."
        },
        mentorEvaluationData: { 
          ratings: { collaboration: 4, quality: 5 },
          narrative: "Completed all lab duties with high precision.",
          overallSummary: "Strong performance and reliable delivery.",
          finalMeetingDate: "2026-04-01",
          signOffDecision: "Approved pending final acknowledgment",
          signOffNotes: "Evaluation reviewed by admin and ready for final acknowledgment.",
          signOffPreparedAt: "2026-04-02T09:00:00.000Z",
          signOffPreparedBy: "Prem Kiran"
        }
      },
      {
        gaId: gaD.id,
        mentorId: mentorA.id,
        unitId: 'UNIT-A',
        status: 'SelfEvaluationCompleted' as const,
        appointmentCode: generateAppointmentCode(),
        expectationData: { 
          mentorGoals: ["Discussion Section Support"],
          goals: ["Discussion Section Support"], 
          weeklyHours: 10, 
          responsibilities: "Lead weekly discussion sections for CS101." 
        },
        selfEvaluationData: { 
          goalProgress: "Facilitated 10 sections and collected feedback.",
          strengths: "Clear facilitation and reliable classroom support.",
          challenges: "Balancing prep time with grading deadlines."
        },
        mentorEvaluationData: {} as any
      },
      {
        gaId: gaD.id,
        mentorId: mentorB.id,
        unitId: 'UNIT-B',
        status: 'MentorEvaluationCompleted' as const,
        appointmentCode: generateAppointmentCode(),
        expectationData: { 
          mentorGoals: ["Grading Support"],
          goals: ["Grading Support"], 
          weeklyHours: 8, 
          responsibilities: "Grade assignments and provide rubric feedback." 
        },
        selfEvaluationData: { 
          goalProgress: "Completed grading for two modules."
        },
        mentorEvaluationData: { 
          ratings: { timeliness: 5, accuracy: 4 },
          narrative: "Consistent grading with minor delays early on.",
          overallSummary: "Solid support and dependable turnaround.",
          finalMeetingDate: "2026-03-28",
          evaluationSubmittedAt: "2026-03-28T15:30:00.000Z",
          evaluationSubmittedBy: "Mentor B"
        }
      }
    ];

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
