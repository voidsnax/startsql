import type { DatabaseDef } from '../data/schemas';

interface Props {
  database: DatabaseDef;
}

export function SchemaPreview({ database }: Props) {
  return (
    <div className="schema-preview">
      <div className="schema-label">Tables in this database</div>
      <div className="schema-tables">
        {database.tables.map((table) => (
          <div key={table.name} className="schema-table">
            <div className="schema-table-name">{table.name}</div>
            <div className="schema-columns">
              {table.columns.map((col) => (
                <div key={col.name} className="schema-column">
                  <span className="schema-col-name">{col.name}</span>
                  <span className="schema-col-type">{col.type}</span>
                  {col.note && (
                    <span className="schema-col-note">{col.note}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}