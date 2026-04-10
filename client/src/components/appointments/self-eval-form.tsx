import { useState } from "react";

import { Button } from "@/components/ui/button";

type SelfEvalFormProps = {
  appointmentId: string | number;
  onSuccess: () => void;
};

export default function SelfEvalForm({
  appointmentId,
  onSuccess,
}: SelfEvalFormProps) {
  const [goalProgress, setGoalProgress] = useState("");
  const [strengths, setStrengths] = useState("");
  const [challenges, setChallenges] = useState("");
  const [additionalComments, setAdditionalComments] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    if (!goalProgress.trim() || !strengths.trim() || !challenges.trim()) {
      alert("Goal progress, strengths, and challenges are required.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validate()) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `http://localhost:3000/api/appointments/${appointmentId}/self-eval`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goalProgress: goalProgress.trim(),
            strengths: strengths.trim(),
            challenges: challenges.trim(),
            additionalComments: additionalComments.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      alert("Self-evaluation submitted successfully.");
      onSuccess();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your self-evaluation."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Complete self-evaluation</h3>
        <p className="text-sm text-muted-foreground">
          Fill out your reflection to move this appointment forward.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Goal progress</p>
          <textarea
            value={goalProgress}
            onChange={(event) => setGoalProgress(event.target.value)}
            placeholder="Describe the progress you made toward your goals..."
            rows={4}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Strengths</p>
          <textarea
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
            placeholder="What went well? What are your strengths?"
            rows={4}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Challenges</p>
          <textarea
            value={challenges}
            onChange={(event) => setChallenges(event.target.value)}
            placeholder="What obstacles or challenges did you run into?"
            rows={4}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Additional comments (optional)</p>
          <textarea
            value={additionalComments}
            onChange={(event) => setAdditionalComments(event.target.value)}
            placeholder="Anything else you'd like to add?"
            rows={3}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit self-evaluation"}
        </Button>
      </div>
    </form>
  );
}