import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "./components/Header";
import { LessonPanel } from "./components/LessonPanel";
import { SqlEditor } from "./components/SqlEditor";
import { ResultTable } from "./components/ResultTable";
import { ChatPanel } from "./components/ChatPanel";
import { DatabaseTab } from "./components/DatabaseTab";
import { QuizCard, parseQuiz } from "./components/QuizCard";
import type { QuizQuestion } from "./components/QuizCard";
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
      `SELECT name, type, pk, "notnull" FROM pragma_table_info('${name.replace(/'/g, "''")}') ORDER BY cid;`,
    );
    const columns =
      cols.error || cols.results.length === 0
        ? []
        : cols.results[0].values.map((c) => ({
            name: String(c[0]),
            type: String(c[1] ?? ""),
            pk: Number(c[2]) > 0,
            notNull: Number(c[3]) > 0,
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

function revealIn(
  pane: HTMLElement | null,
  el: HTMLElement | null,
  align: "start" | "nearest",
) {
  if (!pane || !el) return;
  const paneRect = pane.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  if (align === "start") {
    pane.scrollTo({
      top: pane.scrollTop + (elRect.top - paneRect.top) - 12,
      behavior: "smooth",
    });
    return;
  }
  const past = elRect.bottom - paneRect.bottom + 12;
  if (past > 0) pane.scrollBy({ top: past, behavior: "smooth" });
}

export default function App() {
  const [lesson, setLesson] = useState<Lesson>(lessons[0]);
  const [query, setQuery] = useState(lessons[0].defaultQuery);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [topTab, setTopTab] = useState<TopTab>("editor");
  const [bottomTab, setBottomTab] = useState<BottomTab>("results");
  const [assistantUnread, setAssistantUnread] = useState(false);
  const [mobileView, setMobileView] = useState<"lesson" | "practice">("lesson");
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [usedStaticHint, setUsedStaticHint] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [failCount, setFailCount] = useState(0);
  const [feedback, setFeedback] = useState<{
    status: "success" | "fail";
    message: string;
  } | null>(null);

  const { ready, execute, reset, runIsolated, loadError, schemaVersion } =
    useSqlEngine();
  const { messages, streaming, send, ask, clear } = useChat();
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
  const aiBlockRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const hintRevealed = useRef(false);
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
    setAiHint(null);
    setUsedStaticHint(false);
    setHintLoading(false);
    setQuiz(null);
    setQuizError(null);
    setQuizLoading(false);
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

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    let baseline = vv.height;
    let lastH = 0;
    let lastOpen = false;

    const sync = () => {
      if (vv.scale > 1.02) return;
      const h = Math.round(vv.height);
      if (h > baseline) baseline = h;
      const open = baseline - h > 120;

      if (h !== lastH) {
        lastH = h;
        if (open) root.style.setProperty("--app-h", `${h}px`);
        else root.style.removeProperty("--app-h");
      }
      if (open !== lastOpen) {
        lastOpen = open;
        if (!open) setKeyboardOpen(false);
      }
    };

    const onOrientation = () => {
      baseline = vv.height;
      lastH = 0;
      lastOpen = false;
      root.style.removeProperty("--app-h");
      setKeyboardOpen(false);
    };

    sync();
    vv.addEventListener("resize", sync);
    window.addEventListener("orientationchange", onOrientation);
    return () => {
      vv.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", onOrientation);
      root.style.removeProperty("--app-h");
    };
  }, []);

  useEffect(() => {
    if (!quizLoading && !quiz && !quizError) return;
    revealIn(lessonPaneRef.current, aiBlockRef.current, "start");
  }, [quizLoading, quiz, quizError]);

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

  const endEditing = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setKeyboardOpen(false);
  };

  const handleRun = () => {
    endEditing();
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
    endEditing();
    reset(DATABASE.seedSql);
    setQuery(lesson.defaultQuery);
    setResponse(null);
    setLastExecuted(null);
    setFeedback(null);
    setFailCount(0);
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
          setAiHint(null);
          setUsedStaticHint(false);
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
    setAiHint(null);
    setUsedStaticHint(false);
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

  const staticHintVisible =
    !!currentTask?.hint && (usedStaticHint || failCount >= 3);

  // Reveal a hint once, and only if it landed below the fold.
  useEffect(() => {
    if (!staticHintVisible && !aiHint) {
      hintRevealed.current = false;
      return;
    }
    if (hintRevealed.current) return;
    hintRevealed.current = true;
    revealIn(lessonPaneRef.current, hintRef.current, "nearest");
  }, [staticHintVisible, aiHint]);

  const handleHint = async () => {
    if (!currentTask || hintLoading) return;
    if (currentTask.hint && !staticHintVisible) {
      setUsedStaticHint(true);
      return;
    }
    setHintLoading(true);
    setAiHint("");
    try {
      await ask("hint", chatContext, (t) =>
        setAiHint((prev) => (prev ?? "") + t),
      );
    } catch (err) {
      setAiHint(
        (err as Error).name === "TypeError"
          ? "Couldn't reach the assistant!"
          : (err as Error).message,
      );
    } finally {
      setHintLoading(false);
    }
  };

  const handleReview = () => {
    if (!query.trim() || streaming) return;
    endEditing();
    setTopTab("assistant");
    send("Review the SQL currently in my editor.", chatContext, "review");
  };

  const handleQuiz = async () => {
    if (quizLoading) return;
    setQuizLoading(true);
    setQuizError(null);
    setQuiz(null);
    try {
      const raw = await ask("quiz", chatContext);
      const parsed = parseQuiz(raw);
      if (parsed) setQuiz(parsed);
      else
        setQuizError("The assistant didn't return a usable quiz. Try again.");
    } catch (err) {
      setQuizError(
        (err as Error).name === "TypeError"
          ? "Couldn't reach the assistant!"
          : (err as Error).message,
      );
    } finally {
      setQuizLoading(false);
    }
  };

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
    <div className="app-shell" data-view={mobileView}>
      <Header
        currentLesson={lesson}
        onSelectLesson={(l) => {
          setLesson(l);
          setMobileView("lesson");
        }}
        completedLessons={completedCount}
        totalLessons={totalCount}
        isLessonComplete={isLessonComplete}
        onResetProgress={resetProgress}
        mobileView={mobileView}
        onMobileViewChange={setMobileView}
        practiceDot={assistantUnread}
      />
      <div
        className="app-body"
        data-top={topTab}
        data-editor={keyboardOpen ? "focused" : "idle"}
      >
        <div className="lesson-pane" ref={lessonPaneRef}>
          <LessonPanel lesson={lesson}>
            <TaskFooter
              lesson={lesson}
              currentTaskIndex={currentTaskIndex}
              isTaskComplete={(taskId) => isTaskComplete(lesson.id, taskId)}
              canCheck={!!response && !!currentTask}
              failCount={failCount}
              feedback={feedback}
              onCheckAnswer={handleCheckAnswer}
              onJumpToTask={handleJumpToTask}
              staticHintVisible={staticHintVisible}
              aiHint={aiHint}
              hintLoading={hintLoading}
              onHint={handleHint}
              hintRef={hintRef}
              hasPrevLesson={hasPrevLesson}
              hasNextLesson={hasNextLesson}
              canGoToNext={canGoToNext}
              onPrevLesson={goToPrevLesson}
              onNextLesson={goToNextLesson}
              isCurrentLessonComplete={isLessonComplete(lesson)}
              onMarkComplete={() => markLessonComplete(lesson.id)}
            >
              <div className="lesson-ai-block" ref={aiBlockRef}>
                <div className="lesson-ai-row">
                  <button
                    className="btn-quiz"
                    onClick={handleQuiz}
                    disabled={quizLoading}
                    type="button"
                  >
                    {quizLoading
                      ? "🎯 Building your quiz…"
                      : "🎯 Test me on this lesson"}
                  </button>
                </div>

                {quizError && (
                  <div className="quiz-error">
                    <span>{quizError}</span>
                    <button
                      className="btn-secondary"
                      onClick={handleQuiz}
                      type="button"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {quiz && (
                  <QuizCard
                    questions={quiz}
                    onClose={() => setQuiz(null)}
                    onRetry={handleQuiz}
                  />
                )}
              </div>
            </TaskFooter>
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
              {topTab === "editor" ? (
                <>
                  <button
                    onClick={handleReview}
                    disabled={!query.trim() || streaming}
                    className="btn-secondary"
                    title="Review my SQL"
                    type="button"
                  >
                    <span className="btn-icon">✨</span>
                    <span className="btn-label">Review</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-secondary"
                    title="Reset database"
                    type="button"
                  >
                    <span className="btn-icon">↺</span>
                    <span className="btn-label">Reset DB</span>
                  </button>
                  <button
                    onClick={handleRun}
                    disabled={!ready}
                    className="btn-primary"
                    title="Run query"
                    type="button"
                  >
                    <span className="btn-icon">▶</span>
                    <span className="btn-label">Run</span>
                    <kbd>Ctrl+Enter</kbd>
                  </button>
                </>
              ) : (
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
                disabled={!ready}
                schema={liveSchema}
                onFocusChange={setKeyboardOpen}
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
