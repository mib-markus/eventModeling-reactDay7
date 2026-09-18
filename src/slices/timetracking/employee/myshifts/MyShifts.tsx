import { useEffect, useState } from 'react';
import { queryReadModel } from '../../../../lib/api';

export interface MyShiftsProps {
  employeeId: string;
  /** The moment to evaluate `clockable` against — normally "now". */
  at: string;
}

interface Shift {
  shiftId: string;
  name: string;
  type: string;
  startDateTime: string;
  endDateTime: string;
  clockInOpensAt: string;
  clockable: boolean;
}

const samples = import.meta.glob<{ default: Shift[] }>('./samples/sample-*.json', {
  eager: true,
});
const samplesByNumber = Object.fromEntries(
  Object.entries(samples).map(([path, mod]) => [
    path.match(/sample-(\d+)\.json$/)![1],
    mod.default,
  ]),
);

export function MyShifts({ employeeId, at }: MyShiftsProps) {
  const queryKey = `${employeeId}|${at}`;
  const [result, setResult] = useState<{
    queryKey: string;
    shifts: Shift[];
    error: string | null;
  }>({ queryKey: '', shifts: [], error: null });

  useEffect(() => {
    let cancelled = false;
    queryReadModel<Shift[]>(
      {
        table: 'day9_my_shifts',
        select:
          'shiftId:shift_id, name, type, startDateTime:start_date_time, endDateTime:end_date_time, clockInOpensAt:clock_in_opens_at, clockable',
        filters: { employee_id: employeeId },
      },
      samplesByNumber,
    )
      .then((rows) => {
        if (cancelled) return;
        setResult({ queryKey, shifts: rows ?? [], error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          queryKey,
          shifts: [],
          error: err instanceof Error ? err.message : 'Something went wrong',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, at, queryKey]);

  const loading = result.queryKey !== queryKey;
  const { shifts, error } = result;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">My shifts</h1>
        <p className="subtitle is-6 has-text-grey">
          Shifts you are assigned to. A shift becomes clockable 15 minutes before it starts.
        </p>
        {loading && <p className="has-text-grey">Loading your shifts…</p>}
        {!loading && error && (
          <div className="notification is-danger is-light" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && shifts.length === 0 && (
          <p className="has-text-grey">You have no assigned shifts.</p>
        )}
        {!loading && !error && shifts.length > 0 && (
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.shiftId}>
                  <td>{shift.name}</td>
                  <td>{shift.type}</td>
                  <td>{shift.startDateTime}</td>
                  <td>{shift.endDateTime}</td>
                  <td>
                    <span
                      className={`tag ${shift.clockable ? 'is-success' : 'is-light'}`}
                    >
                      {shift.clockable ? 'Clockable' : 'Not clockable yet'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
