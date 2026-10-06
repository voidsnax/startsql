import type { QueryResponse } from '../hooks/useSqlEngine';

interface Props {
  response: QueryResponse;
  onHide?: () => void;
}

function formatCell(cell: unknown): string {
  if (cell === null) return 'NULL';
  if (cell instanceof Uint8Array) return `[BLOB ${cell.length} bytes]`;
  return String(cell);
}

export function ResultTable({ response, onHide }: Props) {
  return (
    <section className="result-panel">
      <div className="result-header">
        <span className="result-label">Results</span>

        <span className="result-meta">
          {response.error
            ? 'Error'
            : response.results.length === 0
            ? 'No rows returned'
            : `${response.results[0].values.length} row${
                response.results[0].values.length === 1 ? '' : 's'
              } · ${response.executionTimeMs.toFixed(1)} ms`}
        </span>

        {onHide && (
          <button
            className="result-hide-btn"
            onClick={onHide}
            title="Hide results"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {response.error ? (
        <div className="result-error">
          <strong>⚠ Error:</strong> {response.error}
        </div>
      ) : response.results.length === 0 ? (
        <div className="result-success">
          ✅ Query executed successfully in {response.executionTimeMs.toFixed(1)} ms
          (no rows returned).
        </div>
      ) : (
        <div className="result-scroll">
          {response.results.map((res, i) => (
            <table key={i}>
              <thead>
                <tr>
                  {res.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.values.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{formatCell(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ))}
        </div>
      )}
    </section>
  );
}