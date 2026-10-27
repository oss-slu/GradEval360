import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { authFetch } from "@/lib/auth-client";

type MentorFinalizeExpectationsFormProps = {
  appointmentId: string | number;
  gaComments?: string;
  onSuccess: () => void;
};

export default function MentorFinalizeExpectationsForm({
  appointmentId,
  gaComments,
  onSuccess,
}: MentorFinalizeExpectationsFormProps) {
  const [endOfYearStartDate, setEndOfYearStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!endOfYearStartDate) {
      toast({
        variant: "destructive",
        title: "Start date required",
        description: "Please choose when the end-of-year workflow should begin.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await authFetch(
        `/api/appointments/${appointmentId}/expectations/finalize`,
        {
          method: "PATCH",
          body: JSON.stringify({
            endOfYearStartDate,
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      toast({
        title: "Expectations finalized",
        description: "The end-of-year workflow start date was saved.",
      });

      onSuccess();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not finalize expectations",
        description:
          error instanceof Error
            ? error.message
            : "Something went wrong while finalizing expectations.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 rounded-lg border bg-slate-50 p-4">
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Finalize expectations</h3>
        <p className="text-sm text-muted-foreground">
          Review the GA response and choose when the end-of-year self-evaluation should open.
        </p>
      </div>

      {gaComments && (
        <div className="mt-4 rounded-md border bg-white p-3">
          <p className="text-sm font-medium">GA comments</p>
          <p className="mt-1 text-sm text-muted-foreground">{gaComments}</p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">End-of-year workflow start date</p>
        <Input
          type="date"
          value={endOfYearStartDate}
          onChange={(event) => setEndOfYearStartDate(event.target.value)}
        />
      </div>

      <div className="mt-4">
        <Button type="submit" disabled={submitting}>
          {submitting ? "Finalizing..." : "Finalize expectations"}
        </Button>
      </div>
    </form>
  );
}