import { useEffect, useMemo, useRef } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { sql, SQLDialect } from "@codemirror/lang-sql";
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
import { SQL_KEYWORDS, SQL_TYPES, SQL_FUNCTIONS } from "../lib/sqlVocabulary";

const DIALECT = SQLDialect.define({
  keywords: SQL_KEYWORDS,
  types: SQL_TYPES,
  builtin: SQL_FUNCTIONS,
});

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

const KEYWORD_OPTIONS: Completion[] = SQL_KEYWORDS.split(/\s+/)
  .filter(Boolean)
  .map((word) => ({ label: word.toUpperCase(), type: "keyword" }));

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
  disabled: boolean;
  schema: EditorTable[];
  onFocusChange: (focused: boolean) => void;
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  disabled,
  schema,
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
      sql({ dialect: DIALECT, upperCaseKeywords: true }),
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
    <div
      className="editor-codemirror"
      onFocus={() => onFocusChange(true)}
      onBlur={() => onFocusChange(false)}
      onClickCapture={() => onFocusChange(true)}
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
  );
}