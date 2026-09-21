import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import ExpectationSettingForm from '@/components/appointments/expectation-setting-form';
import { authClient } from '@/lib/auth-client';

export default function MentorExpectationSettingPage() {
  const { id } = useParams();
  const isNewAppointment = !id;
  const { data: session } = authClient.useSession();

  const navigate = useNavigate();

  const userRoleRaw =
    (session?.user as any)?.role ??
    (session?.user as any)?.userRole ??
    (session?.user as any)?.metadata?.role;

  const userRole = userRoleRaw ? String(userRoleRaw) : null;

  if (userRole !== 'Mentor') {
    return <Navigate to={id ? `/appointments/${id}` : "/appointments"} replace />;
  }

  if (isNewAppointment) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">
              <Link to="/appointments" className="hover:underline">
                Appointments
              </Link>{' '}
              / New expectation setting
            </p>

            <h1 className="text-2xl font-semibold">
              Initial Expectation Setting
            </h1>
          </div>

          <ExpectationSettingForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <p className="text-sm text-muted-foreground">
            <Link to={`/appointments/${id}`} className="hover:underline">
              Appointment details
            </Link>{' '}
            / Mentor Expectation Setting
          </p>

          <h1 className="text-2xl font-semibold">Mentor Expectation Setting</h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Complete the evaluation for this appointment.
          </p>
        </div>

        <ExpectationSettingForm
          appointmentId={id}
          onSuccess={() => {
            navigate(`/appointments/${id}`);
          }}
        />
      </div>
    </div>
  );
}
