import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    if (trimmedGoals.length < 1 || trimmedGoals.length > 3) {
      alert("You need to enter between 1 and 3 goals.");
      return false;
    }

    const tooShort = trimmedGoals.some((goal) => goal.length < 5);
    if (tooShort) {
      alert("Each goal must be at least 5 characters long.");
      return false;
    }

    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateGoals()) return;

    try {
      setSubmitting(true);

      const response = await fetch(
        `http://localhost:3000/api/appointments/${appointmentId}/expectations`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            goals: trimmedGoals,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      alert("Expectations acknowledged successfully.");
      onSuccess();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting your goals."
      );
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