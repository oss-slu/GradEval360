import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { authFetch } from "@/lib/auth-client";

type ExpectationReviewFormProps = {
  appointmentId: string | number;
  onSuccess: () => void;
};

export default function ExpectationReviewForm({
  appointmentId,
  onSuccess,
}: ExpectationReviewFormProps) {
  const [goals, setGoals] = useState<string[]>([""]);
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
    if (goals.length >= 3) return;
    setGoals((current) => [...current, ""]);
  }

  function removeGoal(index: number) {
    setGoals((current) => {
      const next = current.filter((_, i) => i !== index);
      return next.length > 0 ? next : [""];
    });
  }

  function validateGoals() {
    const errors: Record<string, string> = {};

    if (trimmedGoals.length < 1 || trimmedGoals.length > 3) {
      errors.goals = "Please enter between one and three goals before submitting.";
    } else if (trimmedGoals.some((goal) => goal.length < 5)) {
      errors.goals = "Each goal must be at least 5 characters long.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateGoals()) return;
    setFieldErrors({});

    try {
      setSubmitting(true);

      const response = await authFetch(`/api/appointments/${appointmentId}/expectations`, {
        method: "PATCH",
        body: JSON.stringify({
          goals: trimmedGoals,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      toast({
        title: "Expectations acknowledged",
        description: "Your goals were saved successfully.",
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not submit expectations",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while submitting your goals.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Acknowledge expectations</h3>
        <p className="text-sm text-muted-foreground">
          Add 1 to 3 personal goals before acknowledging this work plan.
        </p>
        {Object.keys(fieldErrors).length > 0 && (
          <p className="text-sm font-medium text-red-600">
            Please fix the highlighted fields below.
          </p>
        )}
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
              id={`goal-${appointmentId}-${index}`}
              value={goal}
              onChange={(event) => updateGoal(index, event.target.value)}
              placeholder="Ex: Improve communication with my mentor"
              maxLength={200}
            />
          </div>
        ))}
        {fieldErrors.goals && <p className="text-xs text-red-600">{fieldErrors.goals}</p>}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {goals.length < 3 && (
          <Button type="button" variant="outline" onClick={addGoal}>
            Add goal
          </Button>
        )}

        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Acknowledge expectations"}
        </Button>
      </div>
    </form>
  );
}
