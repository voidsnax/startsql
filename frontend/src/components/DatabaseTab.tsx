import type { EditorTable } from "../hooks/useSqlEngine";

interface Props {
  schema: EditorTable[];
}

export function DatabaseTab({ schema }: Props) {
  if (schema.length === 0) {
    return (
      <div className="pane-empty">
        <span className="pane-empty-icon">◫</span>
        <p className="pane-empty-title">No tables yet</p>
        <p className="pane-empty-sub">
          Run a CREATE TABLE statement and it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="db-tab">
      <div className="db-tab-grid">
        {schema.map((t) => (
          <div key={t.name} className="db-card">
            <div className="db-card-name">
              {t.name}
              <span className="db-card-count">{t.columns.length}</span>
            </div>
            <div className="db-card-cols">
              {t.columns.map((c) => (
                <div key={c.name} className="db-col">
                  <span className="db-col-name">{c.name}</span>
                  <span className="db-col-meta">
                    {c.pk && <span className="db-badge db-badge-pk">PK</span>}
                    {c.notNull && <span className="db-badge">NOT NULL</span>}
                    <span className="db-col-type">{c.type || "—"}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}