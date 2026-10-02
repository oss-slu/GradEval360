export type SummaryResponse = {
  totalAppointments: number;
  completedAppointments: number;
  inProgressAppointments: number;
  completionPercentage: number;
  statusCounts: Record<string, number>;
  pendingItems: Array<{
    id: string;
    appointmentCode?: string;
    status: string;
    unitId?: string;
  }>;
};

export const STATUS_LABELS: Record<string, string> = {
  AwaitingExpectationSetting: "Awaiting Expectation Setting",
  ExpectationSet: "Expectation Set",
  AwaitingSelfEvaluation: "Awaiting Self-Evaluation",
  SelfEvaluationCompleted: "Self-Evaluation Completed",
  MentorEvaluationCompleted: "Mentor Evaluation Completed",
  AwaitingSignOff: "Awaiting Sign-Off",
  FinalEvaluated: "Final Evaluated",
};

export function getStatusLabel(status: string) {
  return STATUS_LABELS[status] ?? status;
}

export function getPendingHeading(role: string | null) {
  if (role === "GA") return "My pending items";
  if (role === "Mentor") return "Mentor follow-up queue";
  if (role === "Admin") return "Admin completion queue";
  return "Pending items";
}

export function buildStatusCards(summary: SummaryResponse | null) {
  if (!summary) return [];

  return Object.entries(summary.statusCounts)
    .filter(([, count]) => count > 0)
    .sort(([, left], [, right]) => right - left)
    .map(([status, count]) => ({
      status,
      label: getStatusLabel(status),
      count,
    }));
}
