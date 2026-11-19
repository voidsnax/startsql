import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { LessonPanel } from "./components/LessonPanel";
import { SqlEditor } from "./components/SqlEditor";
import { ResultTable } from "./components/ResultTable";
import { ChatPanel } from "./components/ChatPanel";
import { DatabaseTab } from "./components/DatabaseTab";
import { TaskFooter } from "./components/TaskFooter";
import { lessons } from "./data/lessons";
import type { Lesson } from "./data/lessons";
import { DATABASE } from "./data/schemas";
import { useSqlEngine } from "./hooks/useSqlEngine";
import type {
  QueryResponse,
  IsolatedRun,
  EditorTable,
} from "./hooks/useSqlEngine";
import { useProgress } from "./hooks/useProgress";
import { useChat } from "./hooks/useChat";
import type { ChatContext } from "./hooks/useChat";
import { validateTask, validateMutation } from "./hooks/useTaskValidator";
import "./App.css";

const SCHEMA_QUERY = `SELECT name AS table_name
FROM sqlite_master
WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
ORDER BY name;`;

function formatResultForLLM(response: QueryResponse): string | undefined {
  if (!response || response.error || response.results.length === 0)
    return undefined;
  const res = response.results[0];
  const header = res.columns.join(" | ");
  const rows = res.values
    .slice(0, 20)
    .map((r) => r.map((c) => (c === null ? "NULL" : String(c))).join(" | "));
  const suffix =
    res.values.length > 20 ? `\n… (${res.values.length - 20} more rows)` : "";
  return `Columns: ${header}\nRows (${res.values.length} total):\n${rows.join("\n")}${suffix}`;
}

function readSchema(execute: (sql: string) => QueryResponse): EditorTable[] {
  const res = execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  );
  if (res.error || res.results.length === 0) return [];
  return res.results[0].values.map((row) => {
    const name = String(row[0]);
    const cols = execute(
      `SELECT name, type FROM pragma_table_info('${name.replace(/'/g, "''")}') ORDER BY cid;`,
    );
    const columns =
      cols.error || cols.results.length === 0
        ? []
        : cols.results[0].values.map((c) => ({
            name: String(c[0]),
            type: String(c[1] ?? ""),
          }));
    return { name, columns };
  });
}

function asResponse(run: IsolatedRun): QueryResponse {
  return {
    results: run.result ? [run.result] : [],
    error: run.error,
    executionTimeMs: 0,
  };
}

type TopTab = "editor" | "assistant";
type BottomTab = "results" | "database";

export default function App() {
  const [lesson, setLesson] = useState<Lesson>(lessons[0]);
  const [query, setQuery] = useState(lessons[0].defaultQuery);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [topTab, setTopTab] = useState<TopTab>("editor");
  const [bottomTab, setBottomTab] = useState<BottomTab>("results");
  const [assistantUnread, setAssistantUnread] = useState(false);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    status: "success" | "fail";
    message: string;
  } | null>(null);

  const { ready, execute, reset, runIsolated, loadError, schemaVersion } =
    useSqlEngine();
  const { messages, streaming, send, clear } = useChat();
  const {
    markTaskComplete,
    markLessonComplete,
    isTaskComplete,
    isLessonComplete,
    completedLessonsCount,
    totalLessonsCount,
    reset: resetProgress,
  } = useProgress();

  const currentTask =
    lesson.tasks.length > 0 ? lesson.tasks[currentTaskIndex] : null;

  const lessonPaneRef = useRef<HTMLDivElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const prevStreaming = useRef(false);

  useEffect(() => {
    window.clearTimeout(advanceTimer.current);
    if (!ready) return;
    reset(DATABASE.seedSql);
    setQuery(lesson.defaultQuery);
    setResponse(null);
    setLastExecuted(null);
    setFeedback(null);
    setFailCount(0);
  }, [lesson, ready, reset]);

  useEffect(() => {
    const firstIncomplete = lesson.tasks.findIndex(
      (t) => !isTaskComplete(lesson.id, t.id),
    );
    setCurrentTaskIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  useEffect(() => {
    if (lessonPaneRef.current) lessonPaneRef.current.scrollTop = 0;
  }, [lesson.id]);

  useEffect(() => {
    if (prevStreaming.current && !streaming && topTab !== "assistant") {
      setAssistantUnread(true);
    }
    prevStreaming.current = streaming;
  }, [streaming, topTab]);

  useEffect(() => {
    if (topTab === "assistant") setAssistantUnread(false);
  }, [topTab]);

  const liveSchema = useMemo(
    () => (ready ? readSchema(execute) : []),
    [ready, lesson, response, execute, schemaVersion],
  );

  const schemaText = useMemo(
    () =>
      liveSchema
        .map((t) => `${t.name}(${t.columns.map((c) => c.name).join(", ")})`)
        .join(", "),
    [liveSchema],
  );

  const handleRun = () => {
    if (!query.trim()) {
      setResponse({
        results: [],
        error: "Nothing to run — write a query first.",
        executionTimeMs: 0,
      });
      setFeedback(null);
      setBottomTab("results");
      return;
    }
    setLastExecuted(query);
    setResponse(execute(query));
    setFeedback(null);
    setBottomTab("results");
  };

  const handleReset = () => {
    reset(DATABASE.seedSql);
    setQuery(lesson.defaultQuery);
    setResponse(null);
    setLastExecuted(null);
    setFeedback(null);
    setFailCount(0);
  };

  const handleShowSchema = () => {
    setLastExecuted(SCHEMA_QUERY);
    setResponse(execute(SCHEMA_QUERY));
    setBottomTab("results");
  };

  const handleCheckAnswer = () => {
    if (!currentTask || !response) return;
    let result;
    if (currentTask.probeQuery) {
      result = validateMutation(
        DATABASE.seedSql,
        query,
        currentTask.solutionQuery,
        currentTask.probeQuery,
        runIsolated,
      );
    } else {
      const studentRes = asResponse(
        runIsolated(DATABASE.seedSql, "SELECT 1;", query),
      );
      const solutionRes = asResponse(
        runIsolated(DATABASE.seedSql, "SELECT 1;", currentTask.solutionQuery),
      );
      result = validateTask(
        studentRes,
        solutionRes,
        currentTask.orderMatters ?? false,
      );
    }

    if (result.passed) {
      markTaskComplete(lesson.id, currentTask.id);
      setFeedback({ status: "success", message: "✅ Correct!" });
      setFailCount(0);
      if (currentTaskIndex < lesson.tasks.length - 1) {
        window.clearTimeout(advanceTimer.current);
        advanceTimer.current = window.setTimeout(() => {
          setCurrentTaskIndex((i) => Math.min(i + 1, lesson.tasks.length - 1));
          setFeedback(null);
          setFailCount(0);
        }, 1200);
      }
    } else {
      setFailCount((c) => c + 1);
      setFeedback({
        status: "fail",
        message: result.reason ?? "Not quite — try again.",
      });
    }

    requestAnimationFrame(() => {
      if (lessonPaneRef.current) {
        lessonPaneRef.current.scrollTo({
          top: lessonPaneRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  };

  const handleJumpToTask = (idx: number) => {
    window.clearTimeout(advanceTimer.current);
    setCurrentTaskIndex(idx);
    setFeedback(null);
    setFailCount(0);
  };

  const lessonIndex = lessons.findIndex((l) => l.id === lesson.id);
  const hasPrevLesson = lessonIndex > 0;
  const hasNextLesson = lessonIndex < lessons.length - 1;
  const canGoToNext = lesson.tasks.length === 0 || isLessonComplete(lesson);

  const goToPrevLesson = () => {
    if (hasPrevLesson) setLesson(lessons[lessonIndex - 1]);
  };

  const goToNextLesson = () => {
    if (!hasNextLesson || !canGoToNext) return;
    if (lesson.tasks.length === 0) markLessonComplete(lesson.id);
    setLesson(lessons[lessonIndex + 1]);
  };

  const chatContext: ChatContext = useMemo(
    () => ({
      lessonId: lesson.id,
      lessonTitle: `${lesson.number}. ${lesson.title}`,
      lessonContent: lesson.content,
      schema: schemaText,
      taskPrompt: currentTask?.prompt,
      taskNumber: currentTask ? currentTaskIndex + 1 : undefined,
      taskTotal: lesson.tasks.length || undefined,
      editorQuery: query,
      editorIsDefault: query === lesson.defaultQuery,
      lastExecutedQuery: lastExecuted ?? undefined,
      lastResult: response ? formatResultForLLM(response) : undefined,
      lastError: response?.error ?? undefined,
    }),
    [
      lesson,
      query,
      response,
      currentTask,
      currentTaskIndex,
      lastExecuted,
      schemaText,
    ],
  );

  const handleSend = (text: string) => {
    setTopTab("assistant");
    send(text, chatContext);
  };

  if (loadError) {
    return (
      <div style={{ padding: 40, color: "#ef4444", fontFamily: "monospace" }}>
        <h2>Failed to load SQL engine</h2>
        <pre>{loadError}</pre>
      </div>
    );
  }

  const resultMeta = response
    ? response.error
      ? "Error"
      : response.results.length === 0
        ? "No rows"
        : `${response.results[0].values.length} row${
            response.results[0].values.length === 1 ? "" : "s"
          } · ${response.executionTimeMs.toFixed(1)} ms`
    : null;

  const completedCount = completedLessonsCount(lessons);
  const totalCount = totalLessonsCount(lessons);

  return (
    <div className="app-shell">
      <div className="app-body" data-top={topTab}>
        <div className="lesson-pane" ref={lessonPaneRef}>
          <Header
            currentLesson={lesson}
            onSelectLesson={setLesson}
            completedLessons={completedCount}
            totalLessons={totalCount}
            isLessonComplete={isLessonComplete}
            onResetProgress={resetProgress}
          />
          <LessonPanel lesson={lesson} database={DATABASE}>
            <TaskFooter
              lesson={lesson}
              currentTaskIndex={currentTaskIndex}
              isTaskComplete={(taskId) => isTaskComplete(lesson.id, taskId)}
              canCheck={!!response && !!currentTask}
              failCount={failCount}
              feedback={feedback}
              onCheckAnswer={handleCheckAnswer}
              onJumpToTask={handleJumpToTask}
              hasPrevLesson={hasPrevLesson}
              hasNextLesson={hasNextLesson}
              canGoToNext={canGoToNext}
              onPrevLesson={goToPrevLesson}
              onNextLesson={goToNextLesson}
              isCurrentLessonComplete={isLessonComplete(lesson)}
              onMarkComplete={() => markLessonComplete(lesson.id)}
            />
          </LessonPanel>
        </div>

        <div className="work-pane">
          <div className="pane-tabs" role="tablist" aria-label="Workspace">
            <button
              role="tab"
              aria-selected={topTab === "editor"}
              className={`pane-tab${topTab === "editor" ? " active" : ""}`}
              onClick={() => setTopTab("editor")}
              type="button"
            >
              Code editor
            </button>
            <button
              role="tab"
              aria-selected={topTab === "assistant"}
              className={`pane-tab${topTab === "assistant" ? " active" : ""}`}
              onClick={() => setTopTab("assistant")}
              type="button"
            >
              Assistant
              {(streaming || assistantUnread) && topTab !== "assistant" && (
                <span className="tab-dot" aria-hidden="true" />
              )}
            </button>
            <div className="pane-tabs-extra">
              {topTab === "assistant" && (
                <>
                  {streaming && <span className="chat-status">thinking…</span>}
                  {messages.length > 0 && !streaming && (
                    <button
                      className="chat-clear-btn"
                      onClick={clear}
                      type="button"
                    >
                      Clear
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="work-top">
            <div className="tab-panel" hidden={topTab !== "editor"}>
              <SqlEditor
                value={query}
                onChange={setQuery}
                onRun={handleRun}
                onReset={handleReset}
                disabled={!ready}
                schema={liveSchema}
                onShowSchema={handleShowSchema}
              />
            </div>
            <div className="tab-panel" hidden={topTab !== "assistant"}>
              <ChatPanel
                messages={messages}
                streaming={streaming}
                active={topTab === "assistant"}
                onSend={handleSend}
              />
            </div>
          </div>

          <div
            className="pane-tabs pane-tabs-output"
            role="tablist"
            aria-label="Output"
          >
            <button
              role="tab"
              aria-selected={bottomTab === "results"}
              className={`pane-tab${bottomTab === "results" ? " active" : ""}`}
              onClick={() => setBottomTab("results")}
              type="button"
            >
              Query results
            </button>
            <button
              role="tab"
              aria-selected={bottomTab === "database"}
              className={`pane-tab${bottomTab === "database" ? " active" : ""}`}
              onClick={() => setBottomTab("database")}
              type="button"
            >
              Database
            </button>
            <div className="pane-tabs-extra">
              {bottomTab === "results" && resultMeta && (
                <span className="result-meta">{resultMeta}</span>
              )}
              {bottomTab === "database" && (
                <span className="result-meta">
                  {liveSchema.length}{" "}
                  {liveSchema.length === 1 ? "table" : "tables"}
                </span>
              )}
            </div>
          </div>

          <div className="work-bottom">
            <div className="tab-panel" hidden={bottomTab !== "results"}>
              <ResultTable response={response} />
            </div>
            <div className="tab-panel" hidden={bottomTab !== "database"}>
              <DatabaseTab schema={liveSchema} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
