import CodeMirror from "@uiw/react-codemirror";
import { sql, SQLite } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  onReset: () => void;
  disabled: boolean;
  tableName?: string;
  lessonCollapsed: boolean;
  onToggleLesson: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  onCollapse: () => void;
  onFocus?: () => void;
}

export function SqlEditor({
  value,
  onChange,
  onRun,
  onReset,
  disabled,
  tableName,
  lessonCollapsed,
  onToggleLesson,
  fullscreen,
  onToggleFullscreen,
  onCollapse,
  onFocus,
}: Props) {
  const runKeymap = Prec.highest(
    keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          onRun();
          return true;
        },
      },
    ]),
  );

  return (
    <div className="sql-editor">
      <div className={`editor-toolbar${fullscreen ? " fullscreen" : ""}`}>
        {!fullscreen && (
          <button
            className="lesson-toggle-btn"
            onClick={onToggleLesson}
            type="button"
          >
            {lessonCollapsed ? "▼ Show lesson" : "▲ Hide lesson"}
          </button>
        )}

        <span className="editor-label">SQL Editor</span>

        {tableName && (
          <span className="editor-table-hint">
            Tables: <strong>{tableName}</strong>
          </span>
        )}

        <div className="editor-actions">
          <button
            className="icon-btn"
            onClick={onToggleFullscreen}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen editor"}
            type="button"
          >
            {fullscreen ? "⤡" : "⤢"}
            <span className="icon-label">
              {fullscreen ? "Exit fullscreen" : "Fullscreen"}
            </span>
          </button>
          {!fullscreen && (
            <button
              className="icon-btn"
              onClick={onCollapse}
              title="Hide editor and results"
              type="button"
            >
              ✕<span className="icon-label">Hide</span>
            </button>
          )}
          <button onClick={onReset} className="btn-secondary">
            Reset DB
          </button>
          <button onClick={onRun} disabled={disabled} className="btn-primary">
            ▶ Run <kbd>Ctrl+Enter</kbd>
          </button>
        </div>
      </div>

      <div className="editor-codemirror">
        <CodeMirror
          value={value}
          height="100%"
          theme={oneDark}
          extensions={[
            sql({ dialect: SQLite, upperCaseKeywords: true }),
            runKeymap,
          ]}
          onChange={onChange}
          onFocus={onFocus}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            autocompletion: true,
          }}
        />
      </div>
    </div>
  );
}
