import { useState } from 'react';
import { postCommand, ApiError } from '../../../../lib/api';

export interface ClockInProps {
  employeeId: string;
  /** The shift selected from MyShifts — `null` when nothing selectable is chosen yet. */
  shiftId: string | null;
  /** Optional override for the moment clocked in at — defaults to "now" when the button is pressed. */
  clockedInAt?: string;
  location?: string;
  terminal?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: ApiError) => void;
}

export function ClockIn({
  employeeId,
  shiftId,
  clockedInAt,
  location = '',
  terminal = '',
  onSuccess,
  onError,
}: ClockInProps) {
  const [form, setForm] = useState({ location, terminal });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField =
    (field: 'location' | 'terminal') => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async () => {
    if (shiftId === null) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await postCommand(`/api/day9/clockin/${encodeURIComponent(employeeId)}`, {
        employeeId,
        shiftId,
        clockedInAt: clockedInAt ?? new Date().toISOString(),
        ...(form.location !== '' ? { location: form.location } : {}),
        ...(form.terminal !== '' ? { terminal: form.terminal } : {}),
      });
      onSuccess?.(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not clock in.';
      setError(message);
      if (err instanceof ApiError) onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="box">
      <div className="columns">
        <div className="column">
          <div className="field">
            <label className="label" htmlFor="clockin-location">
              Location
            </label>
            <div className="control">
              <input
                id="clockin-location"
                className="input"
                type="text"
                value={form.location}
                onChange={setField('location')}
              />
            </div>
          </div>
        </div>
        <div className="column">
          <div className="field">
            <label className="label" htmlFor="clockin-terminal">
              Terminal
            </label>
            <div className="control">
              <input
                id="clockin-terminal"
                className="input"
                type="text"
                value={form.terminal}
                onChange={setField('terminal')}
              />
            </div>
          </div>
        </div>
      </div>
      {error && (
        <div className="notification is-danger is-light" role="alert">
          {error}
        </div>
      )}
      <div className="field">
        <div className="control">
          <button
            type="button"
            className={`button is-primary is-fullwidth${submitting ? ' is-loading' : ''}`}
            disabled={submitting || shiftId === null}
            onClick={submit}
          >
            Clock in
          </button>
        </div>
      </div>
    </div>
  );
}
