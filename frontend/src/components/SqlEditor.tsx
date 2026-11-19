import { useEffect, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";
import {
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import type { EditorTable } from "../hooks/useSqlEngine";

interface CompletionData {
  tables: Completion[];
  columns: Completion[];
  qualified: Map<string, Completion[]>;
}

const EMPTY_DATA: CompletionData = {
  tables: [],
  columns: [],
  qualified: new Map(),
};

const KEYWORD_OPTIONS: Completion[] = [
  "SELECT",
  "FROM",
  "WHERE",
  "AND",
  "OR",
  "NOT",
  "IN",
  "BETWEEN",
  "LIKE",
  "IS",
  "NULL",
  "ORDER",
  "BY",
  "ASC",
  "DESC",
  "LIMIT",
  "OFFSET",
  "DISTINCT",
  "AS",
  "GROUP",
  "HAVING",
  "JOIN",
  "INNER",
  "LEFT",
  "ON",
  "INSERT",
  "INTO",
  "VALUES",
  "UPDATE",
  "SET",
  "DELETE",
  "CREATE",
  "TABLE",
  "ALTER",
  "DROP",
  "ADD",
  "COLUMN",
  "RENAME",
  "TO",
  "PRIMARY",
  "KEY",
  "UNIQUE",
  "DEFAULT",
  "CHECK",
  "FOREIGN",
  "REFERENCES",
  "IF",
  "EXISTS",
  "CASE",
  "WHEN",
  "THEN",
  "ELSE",
  "END",
  "COUNT",
  "SUM",
  "AVG",
  "MIN",
  "MAX",
].map((label) => ({ label, type: "keyword" }));

function buildCompletions(schema: EditorTable[]): CompletionData {
  const tables: Completion[] = schema.map((t) => ({
    label: t.name,
    type: "type",
    detail: "table",
  }));

  const qualified = new Map<string, Completion[]>();
  const owners = new Map<string, string[]>();

  for (const table of schema) {
    qualified.set(
      table.name,
      table.columns.map((c) => ({
        label: c.name,
        type: "property",
        detail: c.type || "column",
      })),
    );
    for (const col of table.columns) {
      const list = owners.get(col.name) ?? [];
      list.push(table.name);
      owners.set(col.name, list);
    }
  }

  const columns: Completion[] = [...owners.entries()].map(([label, names]) => ({
    label,
    type: "property",
    detail: names.join(", "),
  }));

  return { tables, columns, qualified };
}

function completeSql(
  data: CompletionData,
  context: CompletionContext,
): CompletionResult | null {
  const match = context.matchBefore(/[\w.]*$/);
  if (!match) return null;
  if (match.from === match.to && !context.explicit) return null;

  const dot = match.text.lastIndexOf(".");
  if (dot >= 0) {
    const options = data.qualified.get(match.text.slice(0, dot));
    if (!options) return null;
    return { from: match.from + dot + 1, options, validFor: /^\w*$/ };
  }

  return {
    from: match.from,
    options: [...data.columns, ...data.tables, ...KEYWORD_OPTIONS],
    validFor: /^\w*$/,
  };
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  disabled: boolean;
  schema: EditorTable[];
  onShowSchema: () => void;
  onFocusChange: (focused: boolean) => void;
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  onReset,
  disabled,
  schema,
  onShowSchema,
  onFocusChange,
}: Props) {
  const onRunRef = useRef(onRun);
  const disabledRef = useRef(disabled);
  const dataRef = useRef<CompletionData>(EMPTY_DATA);

  useEffect(() => {
    onRunRef.current = onRun;
    disabledRef.current = disabled;
    dataRef.current = buildCompletions(schema);
  }, [onRun, disabled, schema]);

  const extensions = useMemo(
    () => [
      sql({ dialect: SQLite, upperCaseKeywords: true }),
      autocompletion({
        override: [(context) => completeSql(dataRef.current, context)],
      }),
      Prec.highest(
        keymap.of([
          {
            key: "Mod-Enter",
            run: () => {
              if (!disabledRef.current) onRunRef.current();
              return true;
            },
          },
        ]),
      ),
    ],
    [],
  );

  return (
    <div className="sql-editor">
      <div className="editor-toolbar">
        {schema.length > 0 && (
          <button
            type="button"
            className="editor-table-hint"
            onClick={onShowSchema}
            title="List tables in the results pane"
          >
            <span className="editor-table-hint-icon" aria-hidden="true">
              ◫
            </span>
            {schema.length} {schema.length === 1 ? "table" : "tables"}
          </button>
        )}
        <div className="editor-actions">
          <button
            onClick={onReset}
            className="btn-secondary"
            title="Reset database"
            type="button"
          >
            <span className="btn-icon">↺</span>
            <span className="btn-label">Reset DB</span>
          </button>
          <button
            onClick={onRun}
            disabled={disabled}
            className="btn-primary"
            title="Run query"
            type="button"
          >
            <span className="btn-icon">▶</span>
            <span className="btn-label">Run</span>
            <kbd>Ctrl+Enter</kbd>
          </button>
        </div>
      </div>

      <div
        className="editor-codemirror"
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        onPointerDown={() => onFocusChange(true)}
      >
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={extensions}
          onChange={onChange}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            autocompletion: false,
          }}
        />
      </div>
    </div>
  );
}
