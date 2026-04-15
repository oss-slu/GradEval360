import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { authFetch } from "@/lib/auth-client";

type MentorEvalFormProps = {
  appointmentId: string | number;
  onSuccess: () => void;
};

type RatingKey = "communication" | "dependability" | "initiative" | "qualityOfWork";

const ratingPrompts: Array<{ key: RatingKey; label: string }> = [
  { key: "communication", label: "Communication" },
  { key: "dependability", label: "Dependability" },
  { key: "initiative", label: "Initiative" },
  { key: "qualityOfWork", label: "Quality of work" },
];

export default function MentorEvalForm({ appointmentId, onSuccess }: MentorEvalFormProps) {
  const [ratings, setRatings] = useState<Record<RatingKey, string>>({
    communication: "",
    dependability: "",
    initiative: "",
    qualityOfWork: "",
  });
  const [narrative, setNarrative] = useState("");
  const [overallSummary, setOverallSummary] = useState("");
  const [finalMeetingDate, setFinalMeetingDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  function updateRating(key: RatingKey, value: string) {
    setRatings((current) => ({ ...current, [key]: value }));
  }

  function validate() {
    const errors: Record<string, string> = {};

    for (const item of ratingPrompts) {
      const numericValue = Number(ratings[item.key]);
      if (!Number.isInteger(numericValue) || numericValue < 1 || numericValue > 5) {
        errors[item.key] = `${item.label} must be a whole number from 1 to 5.`;
      }
    }

    if (!narrative.trim() || narrative.trim().length < 10) {
      errors.narrative = "Narrative must be at least 10 characters.";
    }

    if (!overallSummary.trim() || overallSummary.trim().length < 10) {
      errors.overallSummary = "Overall summary must be at least 10 characters.";
    }

    if (!finalMeetingDate.trim()) {
      errors.finalMeetingDate = "Please provide the final meeting date.";
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

      const response = await authFetch(`/api/appointments/${appointmentId}/mentor-evaluation`, {
        method: "POST",
        body: JSON.stringify({
          ratings: {
            communication: Number(ratings.communication),
            dependability: Number(ratings.dependability),
            initiative: Number(ratings.initiative),
            qualityOfWork: Number(ratings.qualityOfWork),
          },
          narrative: narrative.trim(),
          overallSummary: overallSummary.trim(),
          finalMeetingDate: finalMeetingDate.trim(),
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      toast({
        title: "Mentor evaluation submitted",
        description: "The appointment is ready for final sign-off review.",
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not submit mentor evaluation",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving the mentor evaluation.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Complete mentor evaluation</h3>
        <p className="text-sm text-muted-foreground">
          Rate performance, add narrative feedback, and record the final meeting date.
        </p>
        {Object.keys(fieldErrors).length > 0 && (
          <p className="text-sm font-medium text-red-600">
            Please fix the highlighted fields below.
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {ratingPrompts.map((item) => (
          <div key={item.key} className="space-y-2">
            <p className="text-sm font-medium">{item.label}</p>
            <Input
              type="number"
              min={1}
              max={5}
              value={ratings[item.key]}
              onChange={(event) => updateRating(item.key, event.target.value)}
              placeholder="1 to 5"
            />
            {fieldErrors[item.key] && <p className="text-xs text-red-600">{fieldErrors[item.key]}</p>}
          </div>
        ))}
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium">Narrative feedback</p>
          <Textarea
            value={narrative}
            onChange={(event) => setNarrative(event.target.value)}
            placeholder="Describe the GA's performance, impact, and context."
            rows={4}
          />
          {fieldErrors.narrative && <p className="text-xs text-red-600">{fieldErrors.narrative}</p>}
        </div>
        <div className="space-y-2 md:col-span-2">
          <p className="text-sm font-medium">Overall summary</p>
          <Textarea
            value={overallSummary}
            onChange={(event) => setOverallSummary(event.target.value)}
            placeholder="Summarize the overall evaluation and recommendation."
            rows={3}
          />
          {fieldErrors.overallSummary && (
            <p className="text-xs text-red-600">{fieldErrors.overallSummary}</p>
          )}
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Final meeting date</p>
          <Input
            type="date"
            value={finalMeetingDate}
            onChange={(event) => setFinalMeetingDate(event.target.value)}
          />
          {fieldErrors.finalMeetingDate && (
            <p className="text-xs text-red-600">{fieldErrors.finalMeetingDate}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit mentor evaluation"}
        </Button>
      </div>
    </form>
  );
}
