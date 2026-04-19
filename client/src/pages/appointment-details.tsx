import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";

import { AppHeader } from "@/components/app-header";
import { AppSidebar } from "@/components/app-sidebar";
import ExpectationReviewForm from "@/components/appointments/expectation-review-form";
import ExpectationSettingForm from "@/components/appointments/expectation-setting-form";
import FinalSignOffForm from "@/components/appointments/final-signoff-form";
import MentorEvalForm from "@/components/appointments/mentor-eval-form";
import SelfEvalForm from "@/components/appointments/self-eval-form";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authClient, authFetch } from "@/lib/auth-client";
import {
  deriveGoalSections,
  formatDateTime,
  formatTimestamp,
  getAppointmentTitle,
  getAvailableActions,
  STATUS_COPY,
  type AppointmentDetails,
} from "./appointment-details.logic";

const ratingLabels: Record<string, string> = {
  communication: "Communication",
  dependability: "Dependability",
  initiative: "Initiative",
  qualityOfWork: "Quality of work",
};

type TimelineItemProps = {
  title: string;
  statusLabel: string;
  children: ReactNode;
};

function TimelineItem({ title, statusLabel, children }: TimelineItemProps) {
  return (
    <div className="relative rounded-xl border bg-white p-6 shadow-sm">
      <div className="absolute left-0 top-6 h-[calc(100%-3rem)] w-[2px] bg-slate-200" />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full border bg-slate-50 text-xs font-semibold text-slate-600">
            ✓
          </span>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {statusLabel}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-slate-700">
          {statusLabel}
        </span>
      </div>
      <div className="mt-4 space-y-3 text-sm">{children}</div>
    </div>
  );
}

export default function AppointmentDetailsPage() {
  const { id } = useParams();
  const { data: session } = authClient.useSession();
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function refreshAppointment(options?: { preserveLoading?: boolean }) {
    try {
      if (!options?.preserveLoading) {
        setLoading(true);
      }
      setError("");

      if (!id) {
        setError("Missing appointment ID.");
        return;
      }

      const response = await authFetch(`/api/appointments/${id}`, { method: "GET" });
      if (!response.ok) {
        throw new Error(`Failed to load appointment (${response.status})`);
      }

      const data = (await response.json()) as AppointmentDetails;
      setAppointment(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while loading the appointment.";
      setError(message);
    } finally {
      if (!options?.preserveLoading) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshAppointment();
  }, [id]);

  const goalSections = useMemo(() => deriveGoalSections(appointment), [appointment]);
  const { expectationGoals, mentorGoals, gaGoals, hasLegacyCombinedGoals } = goalSections;

  const userRoleRaw =
    (session?.user as any)?.role ??
    (session?.user as any)?.userRole ??
    (session?.user as any)?.metadata?.role;

  const userRole = userRoleRaw ? String(userRoleRaw) : null;
  const statusInfo = appointment?.status ? STATUS_COPY[appointment.status] : null;
  const dateInfo = appointment ? formatDateTime(appointment) : null;

  const {
    canSetExpectations,
    canAcknowledgeExpectations,
    canSubmitSelfEval,
    canSubmitMentorEval,
    canCompleteSignOff,
  } = getAvailableActions(userRole, appointment?.status);

  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex h-screen w-screen overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex h-full min-w-0 flex-1 flex-col">
          <AppHeader />
          <main className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <Link to="/appointments" className="hover:underline">
                      My Appointments
                    </Link>{" "}
                    / Details
                  </p>
                  <h1 className="text-2xl font-semibold">
                    {appointment ? getAppointmentTitle(appointment) : "Appointment details"}
                  </h1>
                  {appointment?.appointmentCode && (
                    <p className="text-sm font-medium text-muted-foreground">
                      Appointment {appointment.appointmentCode}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium text-slate-700">
                  {statusInfo?.label ?? appointment?.status ?? "Unknown"}
                </span>
              </div>

              {loading ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">Loading appointment details...</p>
                </div>
              ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 shadow-sm">
                  <p className="text-sm font-medium text-red-700">Could not load appointment.</p>
                  <p className="mt-1 text-sm text-red-600">{error}</p>
                </div>
              ) : !appointment ? (
                <div className="rounded-xl border bg-white p-6 shadow-sm">
                  <p className="text-sm text-muted-foreground">Appointment not found.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 lg:grid-cols-[1.4fr,0.9fr]">
                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-semibold">Overview</h2>
                      <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                        <div>
                          <dt className="text-muted-foreground">{dateInfo?.label ?? "Meeting date"}</dt>
                          <dd className="font-medium">{dateInfo?.value ?? "Date not recorded yet"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Unit</dt>
                          <dd className="font-medium">{appointment.unitId ?? "Not assigned"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">GA</dt>
                          <dd className="font-medium">{appointment.gaName ?? "Not assigned"}</dd>
                        </div>
                        <div>
                          <dt className="text-muted-foreground">Mentor</dt>
                          <dd className="font-medium">{appointment.mentorName ?? "Not assigned"}</dd>
                        </div>
                      </dl>
                    </div>

                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                      <h2 className="text-lg font-semibold">Current workflow step</h2>
                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">
                            {statusInfo?.label ?? appointment.status ?? "Unknown"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Primary actor</p>
                          <p className="font-medium">{statusInfo?.owner ?? "Unknown"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Next action</p>
                          <p className="font-medium">{statusInfo?.helper ?? "No action available."}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(canSetExpectations ||
                    canAcknowledgeExpectations ||
                    canSubmitSelfEval ||
                    canSubmitMentorEval ||
                    canCompleteSignOff) && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <h2 className="text-lg font-semibold">Required action</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Complete the next Milestone 2 step directly from this page.
                        </p>
                        <div className="mt-4">
                          {canSetExpectations && (
                            <ExpectationSettingForm
                              appointmentId={appointment.id}
                              onSuccess={() => {
                                void refreshAppointment({ preserveLoading: true });
                              }}
                            />
                          )}
                          {canAcknowledgeExpectations && (
                            <ExpectationReviewForm
                              appointmentId={appointment.id}
                              onSuccess={() => {
                                void refreshAppointment({ preserveLoading: true });
                              }}
                            />
                          )}
                          {canSubmitSelfEval && (
                            <SelfEvalForm
                              appointmentId={appointment.id}
                              onSuccess={() => {
                                void refreshAppointment({ preserveLoading: true });
                              }}
                            />
                          )}
                          {canSubmitMentorEval && (
                            <MentorEvalForm
                              appointmentId={appointment.id}
                              onSuccess={() => {
                                void refreshAppointment({ preserveLoading: true });
                              }}
                            />
                          )}
                          {canCompleteSignOff && (
                            <FinalSignOffForm
                              appointmentId={appointment.id}
                              status={appointment.status ?? ""}
                              onSuccess={() => {
                                void refreshAppointment({ preserveLoading: true });
                              }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <TimelineItem title="Expectation Setting" statusLabel="Expectation review">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {appointment.expectationData?.jobCategory && (
                          <div>
                            <p className="text-muted-foreground">Job category</p>
                            <p className="font-medium">{appointment.expectationData.jobCategory}</p>
                          </div>
                        )}
                        {typeof appointment.expectationData?.weeklyHours === "number" && (
                          <div>
                            <p className="text-muted-foreground">Weekly hours</p>
                            <p className="font-medium">{appointment.expectationData.weeklyHours}</p>
                          </div>
                        )}
                      </div>
                      {mentorGoals.length > 0 ? (
                        <div>
                          <p className="text-muted-foreground">Mentor-defined goals</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {mentorGoals.map((goal) => (
                              <li key={`mentor-${goal}`}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {gaGoals.length > 0 ? (
                        <div>
                          <p className="text-muted-foreground">GA goals</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {gaGoals.map((goal) => (
                              <li key={`ga-${goal}`}>{goal}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      {hasLegacyCombinedGoals ? (
                        <div>
                          <p className="text-muted-foreground">Combined goals</p>
                          <ul className="mt-2 list-disc space-y-1 pl-5">
                            {expectationGoals.map((goal) => (
                              <li key={`combined-${goal}`}>{goal}</li>
                            ))}
                          </ul>
                          <p className="mt-2 text-xs text-muted-foreground">
                            This older record stores mentor and GA goals together, so they cannot be
                            separated automatically.
                          </p>
                        </div>
                      ) : null}
                      {expectationGoals.length === 0 ? (
                        <p className="text-muted-foreground">No goals recorded yet.</p>
                      ) : null}
                      {appointment.expectationData?.responsibilities && (
                        <div>
                          <p className="text-muted-foreground">Responsibilities</p>
                          <p className="font-medium">{appointment.expectationData.responsibilities}</p>
                        </div>
                      )}
                      {appointment.expectationData?.expectedOutputs && (
                        <div>
                          <p className="text-muted-foreground">Expected outputs</p>
                          <p className="font-medium">{appointment.expectationData.expectedOutputs}</p>
                        </div>
                      )}
                      {appointment.expectationData?.expectationsMeetingDate && (
                        <div>
                          <p className="text-muted-foreground">Meeting date</p>
                          <p className="font-medium">
                            {appointment.expectationData.expectationsMeetingDate}
                          </p>
                        </div>
                      )}
                      {appointment.expectationData?.mentorNotes && (
                        <div>
                          <p className="text-muted-foreground">Mentor notes</p>
                          <p className="font-medium">{appointment.expectationData.mentorNotes}</p>
                        </div>
                      )}
                      {appointment.expectationData?.mentorAcknowledgedAt && (
                        <div>
                          <p className="text-muted-foreground">Mentor acknowledged</p>
                          <p className="font-medium">
                            {formatTimestamp(appointment.expectationData.mentorAcknowledgedAt)}
                          </p>
                        </div>
                      )}
                      {appointment.expectationData?.gaAcknowledgedAt && (
                        <div>
                          <p className="text-muted-foreground">GA acknowledged</p>
                          <p className="font-medium">
                            {formatTimestamp(appointment.expectationData.gaAcknowledgedAt)}
                          </p>
                        </div>
                      )}
                    </TimelineItem>

                    <TimelineItem title="Self-Evaluation" statusLabel="GA reflection">
                      {appointment.selfEvaluationData?.goalProgress ? (
                        <>
                          <div>
                            <p className="text-muted-foreground">Goal progress</p>
                            <p className="font-medium">{appointment.selfEvaluationData.goalProgress}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Strengths</p>
                            <p className="font-medium">{appointment.selfEvaluationData.strengths}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Challenges</p>
                            <p className="font-medium">{appointment.selfEvaluationData.challenges}</p>
                          </div>
                          {appointment.selfEvaluationData.additionalComments && (
                            <div>
                              <p className="text-muted-foreground">Additional comments</p>
                              <p className="font-medium">
                                {appointment.selfEvaluationData.additionalComments}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          Self-evaluation has not been submitted yet.
                        </p>
                      )}
                    </TimelineItem>

                    <TimelineItem title="Mentor Evaluation" statusLabel="Mentor review">
                      {appointment.mentorEvaluationData?.narrative ? (
                        <>
                          {appointment.mentorEvaluationData.ratings &&
                            Object.entries(appointment.mentorEvaluationData.ratings).length > 0 && (
                              <div className="grid gap-3 sm:grid-cols-2">
                                {Object.entries(appointment.mentorEvaluationData.ratings).map(
                                  ([key, value]) => (
                                    <div key={key}>
                                      <p className="text-muted-foreground">
                                        {ratingLabels[key] ?? key}
                                      </p>
                                      <p className="font-medium">{value} / 5</p>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          <div>
                            <p className="text-muted-foreground">Narrative</p>
                            <p className="font-medium">{appointment.mentorEvaluationData.narrative}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Overall summary</p>
                            <p className="font-medium">
                              {appointment.mentorEvaluationData.overallSummary}
                            </p>
                          </div>
                          {appointment.mentorEvaluationData.finalMeetingDate && (
                            <div>
                              <p className="text-muted-foreground">Final meeting date</p>
                              <p className="font-medium">
                                {appointment.mentorEvaluationData.finalMeetingDate}
                              </p>
                            </div>
                          )}
                          {appointment.mentorEvaluationData.evaluationSubmittedAt && (
                            <div>
                              <p className="text-muted-foreground">Submitted by mentor</p>
                              <p className="font-medium">
                                {appointment.mentorEvaluationData.evaluationSubmittedBy ?? "Mentor"} on{" "}
                                {formatTimestamp(appointment.mentorEvaluationData.evaluationSubmittedAt)}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          Mentor evaluation has not been submitted yet.
                        </p>
                      )}
                    </TimelineItem>

                    <TimelineItem title="Final Sign-Off" statusLabel="Admin completion">
                      {appointment.mentorEvaluationData?.signOffDecision ? (
                        <>
                          <div>
                            <p className="text-muted-foreground">Decision</p>
                            <p className="font-medium">
                              {appointment.mentorEvaluationData.signOffDecision}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Notes</p>
                            <p className="font-medium">{appointment.mentorEvaluationData.signOffNotes}</p>
                          </div>
                          {appointment.mentorEvaluationData.signOffPreparedAt && (
                            <div>
                              <p className="text-muted-foreground">Prepared by admin</p>
                              <p className="font-medium">
                                {appointment.mentorEvaluationData.signOffPreparedBy ?? "Admin"} on{" "}
                                {formatTimestamp(appointment.mentorEvaluationData.signOffPreparedAt)}
                              </p>
                            </div>
                          )}
                          {appointment.mentorEvaluationData.finalAcknowledgedAt ? (
                            <div>
                              <p className="text-muted-foreground">Final acknowledgment</p>
                              <p className="font-medium">
                                {appointment.mentorEvaluationData.finalAcknowledgedBy ?? "Admin"} on{" "}
                                {formatTimestamp(appointment.mentorEvaluationData.finalAcknowledgedAt)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-muted-foreground">
                              Final acknowledgment has not been recorded yet.
                            </p>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">
                          Final sign-off has not been prepared yet.
                        </p>
                      )}
                    </TimelineItem>
                  </div>
                </>
              )}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
