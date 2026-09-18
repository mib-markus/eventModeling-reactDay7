import { useState } from 'react';
import { MyShifts as MyShiftsView } from '../slices/timetracking/employee/myshifts/MyShifts';
import { ClockIn } from '../slices/timetracking/employee/clockin/ClockIn';

export interface MyShiftsPageProps {
  employeeId: string;
  /** The moment to evaluate shift clockability against — normally "now". */
  at: string;
}

export function MyShiftsPage({ employeeId, at }: MyShiftsPageProps) {
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">My shifts</h1>
        <p className="subtitle is-6 has-text-grey">
          Pick the shift you are starting. Clock in opens 15 minutes before the shift begins.
        </p>
        <MyShiftsView
          employeeId={employeeId}
          at={at}
          onSelectionChange={setSelectedShiftId}
        />
        <ClockIn employeeId={employeeId} shiftId={selectedShiftId} />
      </div>
    </section>
  );
}
