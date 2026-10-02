import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';

import ExpectationSettingForm from '@/features/appointments/components/ExpectationSettingForm';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth-client';
import { getUserRole } from '@/lib/auth-client.logic';

export default function MentorExpectationSettingPage() {
  const { id } = useParams();
  const isNewAppointment = !id;
  const { data: session } = authClient.useSession();

  const navigate = useNavigate();

  const userRole = getUserRole(session);

  if (userRole !== 'Mentor') {
    return <Navigate to={id ? `/appointments/${id}` : "/appointments"} replace />;
  }

  if (isNewAppointment) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/appointments")}
          >
            Back to appointments
          </Button>
          
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
