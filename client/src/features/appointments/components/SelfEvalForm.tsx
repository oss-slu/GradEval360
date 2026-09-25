import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { authFetch } from "@/lib/auth-client";

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  function validate() {
    const errors: Record<string, string> = {};

    if (!goalProgress.trim()) {
      errors.goalProgress = "Please describe your goal progress.";
    } else if (goalProgress.trim().length < 5) {
      errors.goalProgress = "Goal progress must be at least 5 characters.";
    }

    if (!strengths.trim()) {
      errors.strengths = "Please describe your strengths.";
    } else if (strengths.trim().length < 5) {
      errors.strengths = "Strengths must be at least 5 characters.";
    }

    if (!challenges.trim()) {
      errors.challenges = "Please describe your challenges.";
    } else if (challenges.trim().length < 5) {
      errors.challenges = "Challenges must be at least 5 characters.";
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

      const response = await authFetch(`/api/appointments/${appointmentId}/self-eval`, {
        method: "POST",
        body: JSON.stringify({
          goalProgress: goalProgress.trim(),
          strengths: strengths.trim(),
          challenges: challenges.trim(),
          additionalComments: additionalComments.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      toast({
        title: "Self-evaluation submitted",
        description: "Thanks for completing your reflection.",
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not submit self-evaluation",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting your self-evaluation.",
      });
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
        {Object.keys(fieldErrors).length > 0 && (
          <p className="text-sm font-medium text-red-600">
            Please fix the highlighted fields below.
          </p>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Goal progress</p>
          <Textarea
            value={goalProgress}
            onChange={(event) => setGoalProgress(event.target.value)}
            placeholder="Describe the progress you made toward your goals..."
            rows={4}
          />
          {fieldErrors.goalProgress && (
            <p className="text-xs text-red-600">{fieldErrors.goalProgress}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Strengths</p>
          <Textarea
            value={strengths}
            onChange={(event) => setStrengths(event.target.value)}
            placeholder="What went well? What are your strengths?"
            rows={4}
          />
          {fieldErrors.strengths && (
            <p className="text-xs text-red-600">{fieldErrors.strengths}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Challenges</p>
          <Textarea
            value={challenges}
            onChange={(event) => setChallenges(event.target.value)}
            placeholder="What obstacles or challenges did you run into?"
            rows={4}
          />
          {fieldErrors.challenges && (
            <p className="text-xs text-red-600">{fieldErrors.challenges}</p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Additional comments (optional)</p>
          <Textarea
            value={additionalComments}
            onChange={(event) => setAdditionalComments(event.target.value)}
            placeholder="Anything else you'd like to add?"
            rows={3}
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
