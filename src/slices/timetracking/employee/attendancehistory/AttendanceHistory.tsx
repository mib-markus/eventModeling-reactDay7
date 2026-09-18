import { useEffect, useState } from 'react';
import { queryReadModel } from '../../../../lib/api';

export interface AttendanceHistoryProps {
  employeeId: string;
  /** Initial month to show, "YYYY-MM" — defaults to the current month if omitted. */
  month?: string;
}

interface AttendanceEntry {
  entryId: string;
  shiftId: string;
  shiftName: string;
  clockedInAt: string;
  clockedOutAt?: string;
  hoursWorked?: number;
  monthHoursWorked: number;
}

const samples = import.meta.glob<{ default: AttendanceEntry[] }>('./samples/sample-*.json', {
  eager: true,
});
const samplesByNumber = Object.fromEntries(
  Object.entries(samples).map(([path, mod]) => [
    path.match(/sample-(\d+)\.json$/)![1],
    mod.default,
  ]),
);

const currentMonth = () => new Date().toISOString().slice(0, 7);
const formatDateTime = (value: string) => value.replace('T', ' ');

export function AttendanceHistory({ employeeId, month: initialMonth }: AttendanceHistoryProps) {
  const [month, setMonth] = useState(initialMonth ?? currentMonth());
  const queryKey = `${employeeId}|${month}`;
  const [result, setResult] = useState<{
    queryKey: string;
    entries: AttendanceEntry[];
    error: string | null;
  }>({ queryKey: '', entries: [], error: null });

  useEffect(() => {
    let cancelled = false;
    queryReadModel<AttendanceEntry[]>(
      {
        table: 'day9_attendance_history',
        select:
          'entryId:entry_id, shiftId:shift_id, shiftName:shift_name, clockedInAt:clocked_in_at, clockedOutAt:clocked_out_at, hoursWorked:hours_worked, monthHoursWorked:month_hours_worked',
        filters: { employee_id: employeeId, month },
      },
      samplesByNumber,
    )
      .then((rows) => {
        if (cancelled) return;
        setResult({ queryKey, entries: rows ?? [], error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          queryKey,
          entries: [],
          error: err instanceof Error ? err.message : 'Something went wrong',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [employeeId, month, queryKey]);

  const loading = result.queryKey !== queryKey;
  const { entries, error } = result;
  const monthHoursWorked = entries[0]?.monthHoursWorked ?? 0;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">My attendance</h1>
        <div className="level">
          <div className="level-left">
            <div className="field">
              <div className="control">
                <input
                  className="input"
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="level-right">
            <div className="has-text-right">
              <p className="heading">Hours worked this month</p>
              <p className="title is-4">{monthHoursWorked}</p>
            </div>
          </div>
        </div>
        {loading && <p className="has-text-grey">Loading your attendance…</p>}
        {!loading && error && (
          <div className="notification is-danger is-light" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && entries.length === 0 && (
          <p className="has-text-grey">No attendance recorded for this month.</p>
        )}
        {!loading && !error && entries.length > 0 && (
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Shift</th>
                <th>Clocked in</th>
                <th>Clocked out</th>
                <th className="has-text-right">Hours</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.entryId}>
                  <td>{entry.shiftName}</td>
                  <td>{formatDateTime(entry.clockedInAt)}</td>
                  <td>
                    {entry.clockedOutAt ? (
                      formatDateTime(entry.clockedOutAt)
                    ) : (
                      <span className="tag is-warning">missing</span>
                    )}
                  </td>
                  <td className="has-text-right">
                    {entry.hoursWorked !== undefined ? entry.hoursWorked.toFixed(2) : '—'}
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
