import { useEffect, useState } from 'react';
import { queryReadModel } from '../../../../lib/api';

export interface TableBlocksProps {
  tableNumber: string;
  date: string;
}

interface TableBlock {
  tableNumber: string;
  date: string;
  startTime: string;
  endTime: string;
  reason: string;
}

const samples = import.meta.glob<{ default: TableBlock[] }>('./samples/sample-*.json', {
  eager: true,
});
const samplesByNumber = Object.fromEntries(
  Object.entries(samples).map(([path, mod]) => [
    path.match(/sample-(\d+)\.json$/)![1],
    mod.default,
  ]),
);

export function TableBlocks({ tableNumber, date }: TableBlocksProps) {
  const queryKey = `${tableNumber}|${date}`;
  const [result, setResult] = useState<{
    queryKey: string;
    blocks: TableBlock[];
    error: string | null;
  }>({ queryKey: '', blocks: [], error: null });

  useEffect(() => {
    let cancelled = false;
    queryReadModel<TableBlock[]>(
      {
        table: 'day7_table_blocks',
        select:
          'tableNumber:table_number, date, startTime:start_time, endTime:end_time, reason',
        filters: { table_number: tableNumber, date },
      },
      samplesByNumber,
    )
      .then((rows) => {
        if (cancelled) return;
        setResult({ queryKey, blocks: rows ?? [], error: null });
      })
      .catch((err) => {
        if (cancelled) return;
        setResult({
          queryKey,
          blocks: [],
          error: err instanceof Error ? err.message : 'Something went wrong',
        });
      });
    return () => {
      cancelled = true;
    };
  }, [tableNumber, date, queryKey]);

  const loading = result.queryKey !== queryKey;
  const { blocks, error } = result;

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">Blocked tables</h1>
        <p className="subtitle is-6 has-text-grey">Tables taken out of service on {date}.</p>
        {loading && <p className="has-text-grey">Loading blocks…</p>}
        {!loading && error && (
          <div className="notification is-danger is-light" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && blocks.length === 0 && (
          <p className="has-text-grey">No blocks on this table for this day.</p>
        )}
        {!loading && !error && blocks.length > 0 && (
          <table className="table is-fullwidth is-striped">
            <thead>
              <tr>
                <th>Table</th>
                <th>From</th>
                <th>Until</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {blocks.map((block) => (
                <tr key={`${block.tableNumber}-${block.startTime}-${block.endTime}`}>
                  <td>{block.tableNumber}</td>
                  <td>{block.startTime}</td>
                  <td>{block.endTime}</td>
                  <td>{block.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
