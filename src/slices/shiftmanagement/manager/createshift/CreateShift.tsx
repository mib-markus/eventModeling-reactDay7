import { useState } from 'react';
import { postCommand, ApiError } from '../../../../lib/api';

export interface CreateShiftProps {
  shiftId?: string;
  name?: string;
  type?: string;
  recurring?: boolean;
  fromDay?: string;
  toDay?: string;
  startDateTime?: string;
  endDateTime?: string;
  onSuccess?: (result: unknown) => void;
  onError?: (error: ApiError) => void;
}

export function CreateShift({
  shiftId,
  name = '',
  type = '',
  recurring = false,
  fromDay = '',
  toDay = '',
  startDateTime = '',
  endDateTime = '',
  onSuccess,
  onError,
}: CreateShiftProps) {
  const [form, setForm] = useState({
    shiftId: shiftId ?? crypto.randomUUID(),
    name,
    type,
    recurring,
    fromDay,
    toDay,
    startDateTime,
    endDateTime,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField =
    (field: 'name' | 'type' | 'fromDay' | 'toDay' | 'startDateTime' | 'endDateTime') =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const setRecurring = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, recurring: e.target.checked }));

  const recurrenceDaysMissing = form.recurring && (form.fromDay === '' || form.toDay === '');
  const endBeforeStart =
    form.startDateTime !== '' &&
    form.endDateTime !== '' &&
    new Date(form.endDateTime).getTime() <= new Date(form.startDateTime).getTime();

  const complete =
    form.name !== '' &&
    form.type !== '' &&
    form.startDateTime !== '' &&
    form.endDateTime !== '' &&
    !recurrenceDaysMissing &&
    !endBeforeStart;

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await postCommand(`/api/day8/createshift/${encodeURIComponent(form.shiftId)}`, {
        shiftId: form.shiftId,
        name: form.name,
        type: form.type,
        recurring: form.recurring,
        ...(form.recurring ? { fromDay: form.fromDay, toDay: form.toDay } : {}),
        startDateTime: form.startDateTime,
        endDateTime: form.endDateTime,
      });
      onSuccess?.(undefined);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not create the shift.';
      setError(message);
      if (err instanceof ApiError) onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Create shift</h1>
        <p className="subtitle is-6 has-text-grey">
          Define a shift by name, type, and a date/time range. A shift can either be recurring
          across a range of weekdays or a one-time shift with no days attached.
        </p>
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="createshift-name">
                Name
              </label>
              <div className="control">
                <input
                  id="createshift-name"
                  className="input"
                  type="text"
                  value={form.name}
                  onChange={setField('name')}
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="createshift-type">
                Type
              </label>
              <div className="control">
                <input
                  id="createshift-type"
                  className="input"
                  type="text"
                  value={form.type}
                  onChange={setField('type')}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="field">
          <div className="control">
            <label className="checkbox" htmlFor="createshift-recurring">
              <input
                id="createshift-recurring"
                type="checkbox"
                checked={form.recurring}
                onChange={setRecurring}
              />{' '}
              Recurring shift
            </label>
          </div>
        </div>
        {form.recurring && (
          <div className="columns">
            <div className="column">
              <div className="field">
                <label className="label" htmlFor="createshift-fromday">
                  From day
                </label>
                <div className="control">
                  <input
                    id="createshift-fromday"
                    className="input"
                    type="text"
                    value={form.fromDay}
                    onChange={setField('fromDay')}
                  />
                </div>
              </div>
            </div>
            <div className="column">
              <div className="field">
                <label className="label" htmlFor="createshift-today">
                  To day
                </label>
                <div className="control">
                  <input
                    id="createshift-today"
                    className="input"
                    type="text"
                    value={form.toDay}
                    onChange={setField('toDay')}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="createshift-start">
                Start
              </label>
              <div className="control">
                <input
                  id="createshift-start"
                  className="input"
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={setField('startDateTime')}
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="createshift-end">
                End
              </label>
              <div className="control">
                <input
                  id="createshift-end"
                  className="input"
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={setField('endDateTime')}
                />
              </div>
            </div>
          </div>
        </div>
        {recurrenceDaysMissing && (
          <div className="notification is-warning is-light">
            A recurring shift needs both a from day and a to day.
          </div>
        )}
        {endBeforeStart && (
          <div className="notification is-warning is-light">
            A shift cannot end before it starts.
          </div>
        )}
        {error && (
          <div className="notification is-danger is-light" role="alert">
            {error}
          </div>
        )}
        <div className="field mt-4">
          <div className="control">
            <button
              type="button"
              className={`button is-primary is-fullwidth${submitting ? ' is-loading' : ''}`}
              disabled={submitting || !complete}
              onClick={submit}
            >
              Create shift
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
