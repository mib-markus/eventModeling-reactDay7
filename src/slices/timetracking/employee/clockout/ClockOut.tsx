import { useState } from 'react';
import { postCommand, ApiError } from '../../../../lib/api';

export interface ClockOutProps {
  employeeId: string;
  /** Optional override for the moment clocked out at — defaults to "now" when the button is pressed. */
  clockedOutAt?: string;
  location?: string;
  terminal?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: ApiError) => void;
}

export function ClockOut({
  employeeId,
  clockedOutAt,
  location = '',
  terminal = '',
  onSuccess,
  onError,
}: ClockOutProps) {
  const [form, setForm] = useState({ location, terminal });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField =
    (field: 'location' | 'terminal') => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await postCommand(`/api/day9/clockout/${encodeURIComponent(employeeId)}`, {
        employeeId,
        clockedOutAt: clockedOutAt ?? new Date().toISOString(),
        ...(form.location !== '' ? { location: form.location } : {}),
        ...(form.terminal !== '' ? { terminal: form.terminal } : {}),
      });
      onSuccess?.(result);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not clock out.';
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
            <label className="label" htmlFor="clockout-location">
              Location
            </label>
            <div className="control">
              <input
                id="clockout-location"
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
            <label className="label" htmlFor="clockout-terminal">
              Terminal
            </label>
            <div className="control">
              <input
                id="clockout-terminal"
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
            className={`button is-danger is-fullwidth${submitting ? ' is-loading' : ''}`}
            disabled={submitting}
            onClick={submit}
          >
            Clock out
          </button>
        </div>
      </div>
    </div>
  );
}
