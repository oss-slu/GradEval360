import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { authFetch } from "@/lib/auth-client";

type ExpectationSettingFormProps = {
  appointmentId: string | number;
  onSuccess: () => void;
};

export default function ExpectationSettingForm({
  appointmentId,
  onSuccess,
}: ExpectationSettingFormProps) {
  const [goals, setGoals] = useState<string[]>([""]);
  const [responsibilities, setResponsibilities] = useState("");
  const [expectedOutputs, setExpectedOutputs] = useState("");
  const [weeklyHours, setWeeklyHours] = useState("");
  const [jobCategory, setJobCategory] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [mentorNotes, setMentorNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const trimmedGoals = useMemo(
    () => goals.map((goal) => goal.trim()).filter((goal) => goal.length > 0),
    [goals]
  );

  function updateGoal(index: number, value: string) {
    setGoals((current) => current.map((goal, i) => (i === index ? value : goal)));
  }

  function addGoal() {
    if (goals.length >= 5) return;
    setGoals((current) => [...current, ""]);
  }

  function removeGoal(index: number) {
    setGoals((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  function validate() {
    const errors: Record<string, string> = {};

    if (trimmedGoals.length < 1 || trimmedGoals.length > 5) {
      errors.goals = "Please enter between one and five goals.";
    } else if (trimmedGoals.some((goal) => goal.length < 5)) {
      errors.goals = "Each goal must be at least 5 characters long.";
    }

    if (!responsibilities.trim() || responsibilities.trim().length < 10) {
      errors.responsibilities = "Please enter responsibilities (min 10 characters).";
    }

    if (!expectedOutputs.trim() || expectedOutputs.trim().length < 5) {
      errors.expectedOutputs = "Please describe expected outputs (min 5 characters).";
    }

    const hours = Number(weeklyHours);
    if (!Number.isFinite(hours) || hours < 1 || hours > 20) {
      errors.weeklyHours = "Weekly hours must be between 1 and 20.";
    }

    if (!jobCategory.trim()) {
      errors.jobCategory = "Please enter a job category.";
    }

    if (!meetingDate.trim()) {
      errors.meetingDate = "Please provide the expectations meeting date.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    setFieldErrors({});

    try {
      setSubmitting(true);
      const response = await authFetch(`/api/appointments/${appointmentId}/expectations/setup`, {
        method: "PATCH",
        body: JSON.stringify({
          goals: trimmedGoals,
          responsibilities: responsibilities.trim(),
          expectedOutputs: expectedOutputs.trim(),
          weeklyHours: Number(weeklyHours),
          jobCategory: jobCategory.trim(),
          expectationsMeetingDate: meetingDate.trim(),
          mentorNotes: mentorNotes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      toast({
        title: "Expectations saved",
        description: "The work plan is now ready for GA acknowledgment.",
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not save expectations",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving expectations.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Set expectations</h3>
        <p className="text-sm text-muted-foreground">
          Define duties, goals, and expectations for the appointment.
        </p>
        {Object.keys(fieldErrors).length > 0 && (
          <p className="text-sm font-medium text-red-600">
            Please fix the highlighted fields below.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Job category</p>
          <Input
            value={jobCategory}
            onChange={(event) => setJobCategory(event.target.value)}
            placeholder="Teaching, Research, Administrative..."
          />
          {fieldErrors.jobCategory && (
            <p className="text-xs text-red-600">{fieldErrors.jobCategory}</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Weekly hours</p>
          <Input
            type="number"
            min={1}
            max={20}
            value={weeklyHours}
            onChange={(event) => setWeeklyHours(event.target.value)}
            placeholder="15"
          />
          {fieldErrors.weeklyHours && (
            <p className="text-xs text-red-600">{fieldErrors.weeklyHours}</p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium">Responsibilities</p>
          <Textarea
            value={responsibilities}
            onChange={(event) => setResponsibilities(event.target.value)}
            placeholder="Summarize duties and responsibilities..."
            rows={3}
          />
          {fieldErrors.responsibilities && (
            <p className="text-xs text-red-600">{fieldErrors.responsibilities}</p>
          )}
        </div>
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium">Expected outputs</p>
          <Textarea
            value={expectedOutputs}
            onChange={(event) => setExpectedOutputs(event.target.value)}
            placeholder="Describe expected outputs or milestones..."
            rows={3}
          />
          {fieldErrors.expectedOutputs && (
            <p className="text-xs text-red-600">{fieldErrors.expectedOutputs}</p>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {goals.map((goal, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-medium">Goal {index + 1}</p>
              {goals.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeGoal(index)}
                >
                  Remove
                </Button>
              )}
            </div>
            <Input
              value={goal}
              onChange={(event) => updateGoal(index, event.target.value)}
              placeholder="Enter a SMART goal"
              maxLength={200}
            />
          </div>
        ))}
        {fieldErrors.goals && <p className="text-xs text-red-600">{fieldErrors.goals}</p>}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Expectations meeting date</p>
          <Input
            type="date"
            value={meetingDate}
            onChange={(event) => setMeetingDate(event.target.value)}
          />
          {fieldErrors.meetingDate && (
            <p className="text-xs text-red-600">{fieldErrors.meetingDate}</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Mentor notes (optional)</p>
          <Input
            value={mentorNotes}
            onChange={(event) => setMentorNotes(event.target.value)}
            placeholder="Optional notes"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {goals.length < 5 && (
          <Button type="button" variant="outline" onClick={addGoal}>
            Add goal
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save expectations"}
        </Button>
      </div>
    </form>
  );
}
