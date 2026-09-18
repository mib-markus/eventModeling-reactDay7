import { useState } from 'react';
import { MyShifts as MyShiftsView, type SelectedShift } from '../slices/timetracking/employee/myshifts/MyShifts';
import { ClockIn } from '../slices/timetracking/employee/clockin/ClockIn';
import { ClockOut } from '../slices/timetracking/employee/clockout/ClockOut';

export interface MyShiftsPageProps {
  employeeId: string;
  /** The moment to evaluate shift clockability against — normally "now". */
  at: string;
}

interface OpenSession {
  shift: SelectedShift;
  clockedInAt: string;
}

export function MyShiftsPage({ employeeId, at }: MyShiftsPageProps) {
  const [selectedShift, setSelectedShift] = useState<SelectedShift | null>(null);
  const [openSession, setOpenSession] = useState<OpenSession | null>(null);

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">My shifts</h1>
        {openSession ? (
          <div className="notification is-info is-light">
            Clocked in on <strong>{openSession.shift.name}</strong> since{' '}
            {openSession.clockedInAt.slice(openSession.clockedInAt.indexOf('T') + 1)}.
          </div>
        ) : (
          <p className="subtitle is-6 has-text-grey">
            Pick the shift you are starting. Clock in opens 15 minutes before the shift begins.
          </p>
        )}
        {openSession ? (
          <ClockOut
            employeeId={employeeId}
            onSuccess={() => setOpenSession(null)}
          />
        ) : (
          <>
            <MyShiftsView
              employeeId={employeeId}
              at={at}
              onSelectionChange={setSelectedShift}
            />
            <ClockIn
              employeeId={employeeId}
              shiftId={selectedShift?.shiftId ?? null}
              onSuccess={() => {
                if (selectedShift) {
                  setOpenSession({ shift: selectedShift, clockedInAt: at });
                }
              }}
            />
          </>
        )}
      </div>
    </section>
  );
}
