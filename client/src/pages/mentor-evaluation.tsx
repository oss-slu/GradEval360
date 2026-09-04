import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import MentorEvalForm from '@/components/appointments/mentor-eval-form';
import { authClient } from '@/lib/auth-client';

export default function MentorEvaluationPage() {
  const { id } = useParams();
  const { data: session } = authClient.useSession();

  const navigate = useNavigate();

  const userRoleRaw =
    (session?.user as any)?.role ??
    (session?.user as any)?.userRole ??
    (session?.user as any)?.metadata?.role;

  const userRole = userRoleRaw ? String(userRoleRaw) : null;

  if (!id) {
    return <Navigate to="/appointments" replace />;
  }

  if (userRole !== 'Mentor') {
    return <Navigate to={`/appointments/${id}`} replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link to={`/appointments/${id}`} className="hover:underline">
              Appointment details
            </Link>{' '}
            / Mentor evaluation
          </p>

          <h1 className="text-2xl font-semibold">Mentor Evaluation</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Complete the evaluation for this appointment.
          </p>
        </div>

        <MentorEvalForm
          appointmentId={id}
          onSuccess={() => {
            navigate(`/appointments/${id}`);
          }}
        />
      </div>
    </div>
  );
}
