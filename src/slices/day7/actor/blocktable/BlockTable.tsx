import { useState } from 'react';
import { postCommand } from '../../../../lib/api';

export interface BlockTableProps {
  tableNumber?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
  onSuccess?: () => void;
  onError?: (message: string) => void;
}

export function BlockTable({
  tableNumber = '',
  date = '',
  startTime = '',
  endTime = '',
  reason = '',
  onSuccess,
  onError,
}: BlockTableProps) {
  const [form, setForm] = useState({ tableNumber, date, startTime, endTime, reason });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const complete =
    form.tableNumber !== '' &&
    form.date !== '' &&
    form.startTime !== '' &&
    form.endTime !== '' &&
    form.reason !== '';

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await postCommand(`/api/day7/blocktable/${encodeURIComponent(form.tableNumber)}`, {
        tableNumber: form.tableNumber,
        date: form.date,
        startTime: form.startTime,
        endTime: form.endTime,
        reason: form.reason,
      });
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not block the table.';
      setError(message);
      onError?.(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Block a table</h1>
        <p className="subtitle is-6 has-text-grey">
          Take a table out of service for maintenance or a private event. A table can only be
          blocked when no reservation is held on it.
        </p>
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="blocktable-table">
                Table
              </label>
              <div className="control">
                <input
                  id="blocktable-table"
                  className="input"
                  type="text"
                  value={form.tableNumber}
                  onChange={set('tableNumber')}
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="blocktable-date">
                Date
              </label>
              <div className="control">
                <input
                  id="blocktable-date"
                  className="input"
                  type="text"
                  value={form.date}
                  onChange={set('date')}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="columns">
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="blocktable-from">
                From
              </label>
              <div className="control">
                <input
                  id="blocktable-from"
                  className="input"
                  type="text"
                  value={form.startTime}
                  onChange={set('startTime')}
                />
              </div>
            </div>
          </div>
          <div className="column">
            <div className="field">
              <label className="label" htmlFor="blocktable-until">
                Until
              </label>
              <div className="control">
                <input
                  id="blocktable-until"
                  className="input"
                  type="text"
                  value={form.endTime}
                  onChange={set('endTime')}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="field">
          <label className="label" htmlFor="blocktable-reason">
            Reason
          </label>
          <div className="control">
            <input
              id="blocktable-reason"
              className="input"
              type="text"
              value={form.reason}
              onChange={set('reason')}
            />
          </div>
        </div>
        {error && (
          <div className="notification is-danger is-light" role="alert">
            {error}
          </div>
        )}
        <div className="field mt-4">
          <div className="control">
            <button
              type="button"
              className={`button is-danger is-fullwidth${submitting ? ' is-loading' : ''}`}
              disabled={submitting || !complete}
              onClick={submit}
            >
              Block table
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
