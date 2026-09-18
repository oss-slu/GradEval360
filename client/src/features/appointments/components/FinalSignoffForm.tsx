import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { authFetch } from "@/lib/auth-client";

type FinalSignOffFormProps = {
  appointmentId: string | number;
  status: string;
  onSuccess: () => void;
};

export default function FinalSignOffForm({
  appointmentId,
  status,
  onSuccess,
}: FinalSignOffFormProps) {
  const isPreparationStep = status === "MentorEvaluationCompleted";
  const [signOffDecision, setSignOffDecision] = useState("");
  const [signOffNotes, setSignOffNotes] = useState("");
  const [finalAcknowledged, setFinalAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  function validate() {
    const errors: Record<string, string> = {};

    if (isPreparationStep) {
      if (!signOffDecision.trim() || signOffDecision.trim().length < 3) {
        errors.signOffDecision = "Please enter a sign-off decision.";
      }

      if (!signOffNotes.trim() || signOffNotes.trim().length < 10) {
        errors.signOffNotes = "Sign-off notes must be at least 10 characters.";
      }
    } else if (!finalAcknowledged) {
      errors.finalAcknowledged = "You must confirm the final acknowledgment.";
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

      const response = await authFetch(`/api/appointments/${appointmentId}/final-signoff`, {
        method: "POST",
        body: JSON.stringify(
          isPreparationStep
            ? {
                signOffDecision: signOffDecision.trim(),
                signOffNotes: signOffNotes.trim(),
              }
            : {
                finalAcknowledged: true,
              }
        ),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      toast({
        title: isPreparationStep ? "Sign-off prepared" : "Final sign-off complete",
        description: isPreparationStep
          ? "The appointment is now awaiting final acknowledgment."
          : "This appointment has completed the annual evaluation workflow.",
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not complete sign-off",
        description:
          error instanceof Error ? error.message : "Something went wrong while saving sign-off.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">
          {isPreparationStep ? "Prepare final sign-off" : "Finalize acknowledgment"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {isPreparationStep
            ? "Admin review records the sign-off decision and notes before final acknowledgment."
            : "Confirm the final acknowledgment to move the appointment to FinalEvaluated."}
        </p>
        {Object.keys(fieldErrors).length > 0 && (
          <p className="text-sm font-medium text-red-600">
            Please fix the highlighted fields below.
          </p>
        )}
      </div>

      {isPreparationStep ? (
        <div className="mt-4 grid gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Decision</p>
            <Input
              value={signOffDecision}
              onChange={(event) => setSignOffDecision(event.target.value)}
              placeholder="Approved, approved with notes, follow-up required..."
            />
            {fieldErrors.signOffDecision && (
              <p className="text-xs text-red-600">{fieldErrors.signOffDecision}</p>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Sign-off notes</p>
            <Textarea
              value={signOffNotes}
              onChange={(event) => setSignOffNotes(event.target.value)}
              placeholder="Document the final review outcome and any follow-up."
              rows={4}
            />
            {fieldErrors.signOffNotes && (
              <p className="text-xs text-red-600">{fieldErrors.signOffNotes}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <label className="flex items-start gap-3 rounded-lg border bg-white p-3 text-sm">
            <input
              type="checkbox"
              checked={finalAcknowledged}
              onChange={(event) => setFinalAcknowledged(event.target.checked)}
              className="mt-1"
            />
            <span>
              I confirm the final review is complete and this appointment can be marked
              <span className="font-medium"> FinalEvaluated</span>.
            </span>
          </label>
          {fieldErrors.finalAcknowledged && (
            <p className="text-xs text-red-600">{fieldErrors.finalAcknowledged}</p>
          )}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "Submitting..."
            : isPreparationStep
              ? "Move to awaiting sign-off"
              : "Finalize evaluation"}
        </Button>
      </div>
    </form>
  );
}
