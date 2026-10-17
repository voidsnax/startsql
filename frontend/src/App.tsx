import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { LessonPanel } from "./components/LessonPanel";
import { SqlEditor } from "./components/SqlEditor";
import { ResultTable } from "./components/ResultTable";
import { ChatPanel } from "./components/ChatPanel";
import { TaskFooter } from "./components/TaskFooter";
import { lessons } from "./data/lessons";
import type { Lesson } from "./data/lessons";
import { DATABASE } from "./data/schemas";
import { useSqlEngine } from "./hooks/useSqlEngine";
import type { QueryResponse } from "./hooks/useSqlEngine";
import { useProgress } from "./hooks/useProgress";
import { validateTask, validateMutation } from "./hooks/useTaskValidator";
import type { ChatContext } from "./hooks/useChat";
import "./App.css";

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

function formatSchema(execute: (sql: string) => QueryResponse): string {
  // Start with the seed schema (has column notes)
  const knownTables = DATABASE.tables.map((t) => ({
    name: t.name,
    columns: t.columns.map((c) => c.name).join(", "),
  }));

  // Ask the live DB for all tables (includes user-created ones)
  const res = execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;",
  );
  const liveNames: string[] =
    res.error || res.results.length === 0
      ? []
      : res.results[0].values.map((row) => String(row[0]));

  // Merge: use the seed columns when known, otherwise fetch the live columns
  const seen = new Set(knownTables.map((t) => t.name));
  const extra = liveNames
    .filter((n) => !seen.has(n))
    .map((name) => {
      const colsRes = execute(
        `SELECT name FROM pragma_table_info('${name.replace(/'/g, "''")}') ORDER BY cid;`,
      );
      const cols =
        colsRes.error || colsRes.results.length === 0
          ? []
          : colsRes.results[0].values.map((r) => String(r[0]));
      return { name, columns: cols.join(", ") };
    });

  const all = [...knownTables, ...extra];
  return all.map((t) => `${t.name}(${t.columns})`).join(", ");
}

export default function App() {
  const [lesson, setLesson] = useState<Lesson>(lessons[0]);
  const [query, setQuery] = useState(lessons[0].defaultQuery);
  const [response, setResponse] = useState<QueryResponse | null>(null);

  const [lessonCollapsed, setLessonCollapsed] = useState(false);
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [editorFullscreen, setEditorFullscreen] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 900,
  );

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setChatCollapsed(true);
    };
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    status: "success" | "fail";
    message: string;
  } | null>(null);

  const { ready, execute, reset, runIsolated, loadError } = useSqlEngine();
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
  const lessonRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    reset(DATABASE.seedSql);
    setQuery(lesson.defaultQuery);
    setResponse(null);
    setLessonCollapsed(false);
    setEditorCollapsed(false);
    setEditorFullscreen(false);
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
    if (lessonRowRef.current) {
      lessonRowRef.current.scrollTop = 0;
    }
  }, [lesson.id]);

  const handleRun = () => {
    if (!query.trim()) {
      setResponse({
        results: [],
        error: "Nothing to run — write a query first.",
        executionTimeMs: 0,
      });
      setFeedback(null);
      return;
    }
    setResponse(execute(query));
    setFeedback(null);
  };

  const handleReset = () => {
    reset(DATABASE.seedSql);
    setQuery(lesson.defaultQuery);
    setResponse(null);
    setFeedback(null);
    setFailCount(0);
  };

  const handleCheckAnswer = () => {
    if (!currentTask || !response) return;

    let result;

    if (currentTask.probeQuery) {
      // Mutation task — use isolated validation
      result = validateMutation(
        DATABASE.seedSql,
        query,
        currentTask.solutionQuery,
        currentTask.probeQuery,
        runIsolated,
      );
    } else {
      // Query task — compare result sets
      const solutionRes = execute(currentTask.solutionQuery);
      result = validateTask(
        response,
        solutionRes,
        currentTask.orderMatters ?? false,
      );
    }

    if (result.passed) {
      markTaskComplete(lesson.id, currentTask.id);
      setFeedback({ status: "success", message: "✅ Correct!" });
      setFailCount(0);
      if (currentTaskIndex < lesson.tasks.length - 1) {
        setTimeout(() => {
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
      if (lessonRowRef.current) {
        lessonRowRef.current.scrollTo({
          top: lessonRowRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    });
  };

  const handleJumpToTask = (idx: number) => {
    setCurrentTaskIndex(idx);
    setFeedback(null);
    setFailCount(0);
  };

  const handleShowLesson = () => {
    setLessonCollapsed(false);
    setResponse(null);
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
    if (lesson.tasks.length === 0) {
      markLessonComplete(lesson.id);
    }
    setLesson(lessons[lessonIndex + 1]);
  };

  const chatContext: ChatContext = useMemo(
    () => ({
      lessonId: lesson.id,
      lessonTitle: `${lesson.number}. ${lesson.title}`,
      lessonContent: lesson.content,
      schema: formatSchema(execute),
      taskPrompt: currentTask?.prompt,
      taskNumber: currentTask ? currentTaskIndex + 1 : undefined,
      taskTotal: lesson.tasks.length || undefined,
      editorQuery: query,
      editorIsDefault: query === lesson.defaultQuery,
      lastExecutedQuery: response ? query : undefined,
      lastResult: response ? formatResultForLLM(response) : undefined,
      lastError: response?.error ?? undefined,
    }),
    [lesson, query, response, currentTask, currentTaskIndex, execute],
  );

  if (loadError) {
    return (
      <div style={{ padding: 40, color: "#ef4444", fontFamily: "monospace" }}>
        <h2>Failed to load SQL engine</h2>
        <pre>{loadError}</pre>
      </div>
    );
  }

  const bodyClass = [
    "app-body",
    editorFullscreen ? "editor-fullscreen" : "",
    chatCollapsed && !editorFullscreen ? "chat-collapsed" : "",
    response ? "has-results" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const mainClass = [
    "main-area",
    lessonCollapsed ? "lesson-collapsed" : "",
    editorCollapsed ? "editor-collapsed" : "",
    response ? "has-results" : "no-results",
  ]
    .filter(Boolean)
    .join(" ");

  const completedCount = completedLessonsCount(lessons);
  const totalCount = totalLessonsCount(lessons);

  return (
    <div
      className={`app-shell${editorFullscreen ? " app-shell--fullscreen" : ""}`}
    >
      <Header
        currentLesson={lesson}
        onSelectLesson={setLesson}
        completedLessons={completedCount}
        totalLessons={totalCount}
        isLessonComplete={isLessonComplete}
        onResetProgress={resetProgress}
      />

      <div className={bodyClass}>
        <main className={mainClass}>
          <div className="lesson-row" ref={lessonRowRef}>
            <LessonPanel
              lesson={lesson}
              database={DATABASE}
              collapsed={lessonCollapsed}
              onToggle={() => {
                if (lessonCollapsed) handleShowLesson();
                else setLessonCollapsed(true);
              }}
            >
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

          {!editorCollapsed ? (
            <div className="workzone-row">
              <div className="editor-row">
                <SqlEditor
                  value={query}
                  onChange={setQuery}
                  onRun={handleRun}
                  onReset={handleReset}
                  disabled={!ready}
                  tableName={DATABASE.tables.map((t) => t.name).join(", ")}
                  lessonCollapsed={lessonCollapsed}
                  onToggleLesson={() => {
                    if (lessonCollapsed) handleShowLesson();
                    else setLessonCollapsed(true);
                  }}
                  fullscreen={editorFullscreen}
                  onToggleFullscreen={() => setEditorFullscreen((v) => !v)}
                  onCollapse={() => setEditorCollapsed(true)}
                  onFocus={() => {
                    if (window.innerWidth < 900 && !editorFullscreen) {
                      setEditorFullscreen(true);
                    }
                  }}
                />
              </div>

              {response && (
                <div className="results-row">
                  <ResultTable
                    response={response}
                    onHide={() => setResponse(null)}
                  />
                </div>
              )}
            </div>
          ) : (
            <button
              className="editor-strip"
              onClick={() => setEditorCollapsed(false)}
              type="button"
            >
              <span className="strip-chevron">▶</span>
              <span className="strip-label">Show SQL editor</span>
            </button>
          )}
        </main>

        {!editorFullscreen && (
          <ChatPanel
            context={chatContext}
            collapsed={chatCollapsed}
            onToggle={() => setChatCollapsed((v) => !v)}
          />
        )}
      </div>
    </div>
  );
}
