import type { QueryResponse } from "../hooks/useSqlEngine";

interface Props {
  response: QueryResponse | null;
}

function formatCell(cell: unknown): string {
  if (cell === null) return "NULL";
  if (cell instanceof Uint8Array) return `[BLOB ${cell.length} bytes]`;
  return String(cell);
}

export function ResultTable({ response }: Props) {
  if (!response) {
    return (
      <div className="pane-empty">
        <span className="pane-empty-icon">▶</span>
        <p className="pane-empty-title">No results yet</p>
        <p className="pane-empty-sub">
          Write a query in the editor and press Run (Ctrl+Enter).
        </p>
      </div>
    );
  }

  if (response.error) {
    return (
      <div className="result-error">
        <strong>⚠ Error:</strong> {response.error}
      </div>
    );
  }

  if (response.results.length === 0) {
    return (
      <div className="result-success">
        ✅ Query executed successfully in {response.executionTimeMs.toFixed(1)}{" "}
        ms (no rows returned).
      </div>
    );
  }

  return (
    <div className="result-scroll">
      {response.results.map((res, i) => (
        <table key={i}>
          <thead>
            <tr>
              {res.columns.map((c, ci) => (
                <th key={ci}>{c}</th>
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
  );
}
