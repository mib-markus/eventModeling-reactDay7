import { useEffect, useState } from 'react';
import { queryReadModel } from '../../../../lib/api';

export interface TableStatusProps {
  /** The tables of the room, in the order the board's screen lists them. */
  tables: string[];
  date: string;
}

interface TableHold {
  tableNumber: string;
  date: string;
  reservationCode: string;
  startTime: string;
  endTime: string;
  numberOfPeople: string | null;
}

const samples = import.meta.glob<{ default: TableHold[] }>('./samples/sample-*.json', {
  eager: true,
});
const samplesByNumber = Object.fromEntries(
  Object.entries(samples).map(([path, mod]) => [
    path.match(/sample-(\d+)\.json$/)![1],
    mod.default,
  ]),
);

// A block holds the table with no guest behind it, so it carries no party size and its
// reservationCode is a key the backend derived rather than one a host would recognise.
const holdDetail = (hold: TableHold) =>
  [
    hold.reservationCode.startsWith('BLOCK-') ? 'blocked' : hold.reservationCode,
    `${hold.startTime} – ${hold.endTime}`,
    hold.numberOfPeople ? `${hold.numberOfPeople} people` : null,
  ]
    .filter(Boolean)
    .join(' · ');

export function TableStatus({ tables, date }: TableStatusProps) {
  const [result, setResult] = useState<{
    queryKey: string;
    holds: TableHold[];
    error: string | null;
  }>({ queryKey: '', holds: [], error: null });

  useEffect(() => {
    let cancelled = false;
    queryReadModel<TableHold[]>(
      {
        table: 'day7_table_status',
        select:
          'tableNumber:table_number, date, reservationCode:reservation_code, startTime:start_time, endTime:end_time, numberOfPeople:number_of_people',
        filters: { date },
      },
      samplesByNumber,
    )
      .then((rows) => {
        if (cancelled) return;
        setResult({ queryKey: date, holds: rows ?? [], error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          queryKey: date,
          holds: [],
          error: err instanceof Error ? err.message : 'Something went wrong',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  const loading = result.queryKey !== date;
  const { holds, error } = result;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Table status — {date}</h1>
        <p className="subtitle is-6 has-text-grey">Which tables are held, and for whom.</p>
        {loading && <p className="has-text-grey">Loading table status…</p>}
        {!loading && error && (
          <div className="notification is-danger is-light" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="columns is-multiline">
            {tables.map((table) => {
              // A table with no row is free: only a confirmation or a block puts one there,
              // and cancelling or releasing a no-show takes it away again.
              const tableHolds = holds.filter((hold) => hold.tableNumber === table);
              const held = tableHolds.length > 0;

              return (
                <div className="column is-one-third" key={table}>
                  <div className="box">
                    <p className="heading">Table {table}</p>
                    <p className={`title is-5 ${held ? 'has-text-danger' : 'has-text-success'}`}>
                      {held ? 'Held' : 'Free'}
                    </p>
                    {held ? (
                      tableHolds.map((hold) => (
                        <p
                          className="is-size-7 has-text-grey"
                          key={`${hold.reservationCode}-${hold.startTime}`}
                        >
                          {holdDetail(hold)}
                        </p>
                      ))
                    ) : (
                      <p className="is-size-7 has-text-grey">no reservation</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
