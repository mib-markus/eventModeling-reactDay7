import { useEffect, useState } from 'react';
import { queryReadModel } from '../../../../lib/api';

export interface SelectedShift {
  shiftId: string;
  name: string;
}

export interface MyShiftsProps {
  employeeId: string;
  /** The moment to evaluate `clockable` against — normally "now". */
  at: string;
  /** Notified whenever the selected shift changes — lets a parent page wire ClockIn to it. */
  onSelectionChange?: (shift: SelectedShift | null) => void;
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

const formatDateTime = (value: string) => value.replace('T', ' ');
const formatTime = (value: string) => value.slice(value.indexOf('T') + 1);

export function MyShifts({ employeeId, at, onSelectionChange }: MyShiftsProps) {
  const queryKey = `${employeeId}|${at}`;
  const [result, setResult] = useState<{
    queryKey: string;
    shifts: Shift[];
    error: string | null;
  }>({ queryKey: '', shifts: [], error: null });
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

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

  const effectiveSelectedShiftId =
    selectedShiftId && shifts.some((shift) => shift.shiftId === selectedShiftId && shift.clockable)
      ? selectedShiftId
      : shifts.find((shift) => shift.clockable)?.shiftId ?? null;
  const effectiveSelectedShift =
    shifts.find((shift) => shift.shiftId === effectiveSelectedShiftId) ?? null;

  useEffect(() => {
    onSelectionChange?.(
      effectiveSelectedShift
        ? { shiftId: effectiveSelectedShift.shiftId, name: effectiveSelectedShift.name }
        : null,
    );
  }, [effectiveSelectedShift, onSelectionChange]);

  return (
    <>
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
              <th></th>
              <th>Shift</th>
              <th>Type</th>
              <th>Start</th>
              <th>End</th>
              <th>Clock in opens</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr
                key={shift.shiftId}
                className={shift.shiftId === effectiveSelectedShiftId ? 'is-selected' : undefined}
              >
                <td>
                  <input
                    type="radio"
                    name="selected-shift"
                    checked={shift.shiftId === effectiveSelectedShiftId}
                    disabled={!shift.clockable}
                    onChange={() => setSelectedShiftId(shift.shiftId)}
                  />
                </td>
                <td>{shift.name}</td>
                <td>{shift.type}</td>
                <td>{formatDateTime(shift.startDateTime)}</td>
                <td>{formatDateTime(shift.endDateTime)}</td>
                <td>
                  {shift.clockable ? (
                    formatTime(shift.clockInOpensAt)
                  ) : (
                    <span className="tag is-light">not yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
