import { APPOINTMENT_STATUS } from "../../../shared/schemas/appointment.js";
import type { RequestUser } from "./appointments.logic.js";

export type GaUnitRow = {
  gaId: string;
  gaName: string;
  gaEmail: string;
  unitId: string | null;
};

export type GaAppointmentRow = {
  gaId: string;
  gaName: string;
  gaEmail: string;
  mentorName: string | null;
  unitId: string;
  status: string;
};

export type GaRosterEntry = {
  gaId: string;
  gaName: string;
  gaEmail: string;
  units: string[];
  mentors: string[];
  openAppointments: number;
  totalAppointments: number;
};

export function canViewGaRoster(user: Pick<RequestUser, "role"> | null | undefined): boolean {
  return user?.role === "Admin";
}

// An appointment stays open until the final evaluation is done.
export function isOpenStatus(status: string): boolean {
  return status !== APPOINTMENT_STATUS.FINAL;
}

type Accumulator = {
  entry: GaRosterEntry;
  units: Set<string>;
  openMentors: Set<string>;
  otherMentors: Set<string>;
};

const sortText = (values: Iterable<string>) =>
  [...values].sort((a, b) => a.localeCompare(b));

export function buildGaRoster(
  gaUnitRows: GaUnitRow[],
  appointmentRows: GaAppointmentRow[],
): GaRosterEntry[] {
  const byGa = new Map<string, Accumulator>();

  const getOrCreate = (row: { gaId: string; gaName: string; gaEmail: string }) => {
    let acc = byGa.get(row.gaId);
    if (!acc) {
      acc = {
        entry: {
          gaId: row.gaId,
          gaName: row.gaName,
          gaEmail: row.gaEmail,
          units: [],
          mentors: [],
          openAppointments: 0,
          totalAppointments: 0,
        },
        units: new Set(),
        openMentors: new Set(),
        otherMentors: new Set(),
      };
      byGa.set(row.gaId, acc);
    }
    return acc;
  };

  for (const row of gaUnitRows) {
    const acc = getOrCreate(row);
    if (row.unitId) acc.units.add(row.unitId);
  }

  for (const row of appointmentRows) {
    const acc = getOrCreate(row);
    acc.units.add(row.unitId);
    acc.entry.totalAppointments += 1;

    const mentor = row.mentorName?.trim();
    if (isOpenStatus(row.status)) {
      acc.entry.openAppointments += 1;
      if (mentor) acc.openMentors.add(mentor);
    } else if (mentor) {
      acc.otherMentors.add(mentor);
    }
  }

  return [...byGa.values()]
    .map(({ entry, units, openMentors, otherMentors }) => ({
      ...entry,
      units: sortText(units),
      // Current mentors (open appointments) first, then past ones.
      mentors: [
        ...sortText(openMentors),
        ...sortText([...otherMentors].filter((name) => !openMentors.has(name))),
      ],
    }))
    .sort((a, b) => a.gaName.localeCompare(b.gaName) || a.gaEmail.localeCompare(b.gaEmail));
}
