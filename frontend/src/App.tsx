import { useEffect, useMemo, useRef, useState } from "react";
import { Header, ActionBar } from "./components/Header";
import type { MobileView, ActionBarProps } from "./components/Header";
import { Icon } from "./components/Icon";
import { LessonPanel } from "./components/LessonPanel";
import { SqlEditor } from "./components/SqlEditor";
import { ResultTable } from "./components/ResultTable";
import { ChatPanel } from "./components/ChatPanel";
import { DatabaseTab } from "./components/DatabaseTab";
import { TaskFooter } from "./components/TaskFooter";
import { QuizCard, parseQuiz } from "./components/QuizCard";
import type { QuizQuestion } from "./components/QuizCard";
import { LESSON_QUIZZES } from "./data/quizzes";
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

const LAST_LESSON_KEY = "startsql:last-lesson";
const SPLIT_KEY = "startsql:split";
const DEFAULT_SPLIT = 0.55;

function readStored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

function initialLesson(): Lesson {
  const id = readStored(LAST_LESSON_KEY);
  return lessons.find((l) => l.id === id) ?? lessons[0];
}

function initialSplit(): number {
  const raw = Number(readStored(SPLIT_KEY));
  return Number.isFinite(raw) && raw >= 0.25 && raw <= 0.75
    ? raw
    : DEFAULT_SPLIT;
}

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

function revealIn(pane: HTMLElement | null, el: HTMLElement | null, pad = 12) {
  if (!pane || !el) return;
  const p = pane.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const alignTop = pane.scrollTop + (r.top - p.top) - pad;
  const showBottom = pane.scrollTop + (r.bottom - p.bottom) + pad;
  if (r.top < p.top + pad) {
    pane.scrollTo({ top: Math.max(0, alignTop), behavior: "smooth" });
  } else if (r.bottom > p.bottom - pad) {
    pane.scrollTo({
      top: Math.max(0, Math.min(showBottom, alignTop)),
      behavior: "smooth",
    });
  }
}

type TopTab = "editor" | "assistant";
type BottomTab = "results" | "database";

export default function App() {
  const [lesson, setLesson] = useState<Lesson>(initialLesson);
  const [query, setQuery] = useState(() => initialLesson().defaultQuery);
  const [response, setResponse] = useState<QueryResponse | null>(null);
  const [lastExecuted, setLastExecuted] = useState<string | null>(null);
  const [top, setTop] = useState<{ tab: TopTab; split: number }>(() => ({
    tab: "editor",
    split: initialSplit(),
  }));
  const [bottomTab, setBottomTab] = useState<BottomTab>("results");
  const [assistantUnread, setAssistantUnread] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>("lesson");
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  const [hintLevel, setHintLevel] = useState(0);
  const [hintUnlocked, setHintUnlocked] = useState(true);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
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
  const feedbackRef = useRef<HTMLDivElement>(null);
  const hintRevealed = useRef(false);
  const lastFailRef = useRef(0);
  const lastErrRef = useRef<string | null>(null);
  const workRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ y: number; split: number } | null>(null);
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
    setHintLevel(0);
    setHintUnlocked(true);
    setAiHint(null);
    setHintLoading(false);
    lastFailRef.current = 0;
    lastErrRef.current = null;
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
    if (prevStreaming.current && !streaming && top.tab !== "assistant") {
      setAssistantUnread(true);
    }
    prevStreaming.current = streaming;
  }, [streaming, top.tab]);

  useEffect(() => {
    if (top.tab === "assistant") setAssistantUnread(false);
  }, [top.tab]);

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
    revealIn(lessonPaneRef.current, aiBlockRef.current);
  }, [quizLoading, quiz, quizError]);

  // A fresh error or another failed check earns the next hint.
  useEffect(() => {
    const err = response?.error ?? null;
    if (
      failCount > lastFailRef.current ||
      (err !== null && err !== lastErrRef.current)
    ) {
      setHintUnlocked(true);
    }
    lastFailRef.current = failCount;
    lastErrRef.current = err;
  }, [failCount, response]);

  useEffect(() => {
    writeStored(LAST_LESSON_KEY, lesson.id);
  }, [lesson.id]);

  useEffect(() => {
    writeStored(SPLIT_KEY, top.split.toFixed(3));
  }, [top.split]);

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

  const chatStarters = useMemo(() => {
    const out: string[] = [];
    if (response?.error)
      out.push("My query failed — what does this error mean?");
    else out.push(`Explain "${lesson.title}" in one short paragraph.`);
    if (currentTask) {
      out.push(`Help me think through task ${currentTaskIndex + 1}.`);
    } else if (liveSchema.length > 0) {
      out.push(`Show a small example using the ${liveSchema[0].name} table.`);
    }
    out.push("What mistakes do beginners make in this lesson?");
    return out.slice(0, 3);
  }, [response, lesson.title, currentTask, currentTaskIndex, liveSchema]);

  const endEditing = () => {
    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();
    setKeyboardOpen(false);
  };

  const changeMobileView = (view: MobileView) => {
    setMobileView(view);
    if (view === "practice") setTop({ tab: "editor", split: top.split });
    if (view === "assistant") setTop({ tab: "assistant", split: top.split });
  };

  const changeTopTab = (tab: TopTab) => {
    setTop({ tab, split: top.split });
    setMobileView(tab === "assistant" ? "assistant" : "practice");
  };

  const handleRun = () => {
    if (!ready || !query.trim()) return;
    endEditing();
    setLastExecuted(query);
    setResponse(execute(query));
    setFeedback(null);
    setBottomTab("results");
  };

  const handleClear = () => {
    setQuery("");
    setFeedback(null);
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
      revealIn(lessonPaneRef.current, feedbackRef.current);
    });
  };

  const handleJumpToTask = (idx: number) => {
    window.clearTimeout(advanceTimer.current);
    setCurrentTaskIndex(idx);
    setFeedback(null);
    setFailCount(0);
    setHintLevel(0);
    setHintUnlocked(true);
    setAiHint(null);
    lastFailRef.current = 0;
    lastErrRef.current = null;
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

  useEffect(() => {
    if (hintLevel === 0 && !aiHint) {
      hintRevealed.current = false;
      return;
    }
    if (hintRevealed.current) return;
    hintRevealed.current = true;
    revealIn(lessonPaneRef.current, hintRef.current);
  }, [hintLevel, aiHint]);

  const handleHint = async () => {
    if (!currentTask || hintLoading || !hintUnlocked) return;
    if (hintLevel === 0 && currentTask.hint) {
      setHintLevel(1);
      setHintUnlocked(false);
      return;
    }
    setHintLoading(true);
    setHintUnlocked(false);
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
      setHintLevel(2);
      setHintLoading(false);
    }
  };

  const handleReview = () => {
    if (!query.trim() || streaming) return;
    endEditing();
    setTop({ tab: "assistant", split: top.split });
    setMobileView("assistant");
    send(
      `Check this query:\n\n\`\`\`sql\n${query.trim()}\n\`\`\``,
      chatContext,
      "review",
    );
  };

  const loadQuiz = async (forceAi = false) => {
    if (quizLoading) return;
    const authored = LESSON_QUIZZES[lesson.id];
    if (!forceAi && authored?.length) {
      setQuiz(authored);
      setQuizError(null);
      return;
    }
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
    setTop({ tab: "assistant", split: top.split });
    setMobileView("assistant");
    send(text, chatContext);
  };

  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = workRef.current?.getBoundingClientRect();
    if (!box) return;
    dragRef.current = { y: e.clientY, split: top.split };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const moveDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const box = workRef.current?.getBoundingClientRect();
    if (!drag || !box || box.height < 200) return;
    e.preventDefault();
    const next = drag.split + (e.clientY - drag.y) / box.height;
    setTop((t) => ({ ...t, split: Math.min(0.75, Math.max(0.25, next)) }));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const nudgeSplit = (delta: number) =>
    setTop((t) => ({
      ...t,
      split: Math.min(0.75, Math.max(0.25, t.split + delta)),
    }));

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

  const actionProps: ActionBarProps = {
    topTab: top.tab,
    onRun: handleRun,
    onReset: handleReset,
    onClear: handleClear,
    onReview: handleReview,
    canRun: ready && !!query.trim(),
    canReview: !!query.trim() && !streaming,
    streaming,
    hasMessages: messages.length > 0,
    onClearChat: clear,
  };

  return (
    <div className="app-shell" data-view={mobileView}>
      <Header
        currentLesson={lesson}
        onSelectLesson={(l) => {
          setLesson(l);
          setMobileView("lesson");
        }}
        completedLessons={completedLessonsCount(lessons)}
        totalLessons={totalLessonsCount(lessons)}
        isLessonComplete={isLessonComplete}
        onResetProgress={resetProgress}
        mobileView={mobileView}
        onMobileViewChange={changeMobileView}
        assistantDot={assistantUnread || streaming}
        topTab={top.tab}
        onTopTabChange={changeTopTab}
        actions={actionProps}
      />

      <div
        className="app-body"
        data-top={top.tab}
        data-editor={keyboardOpen ? "focused" : "idle"}
      >
        <div className="lesson-pane">
          <div className="lesson-scroll" ref={lessonPaneRef}>
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
                authoredHint={currentTask?.hint}
                hintLevel={hintLevel}
                hintUnlocked={hintUnlocked}
                aiHint={aiHint}
                hintLoading={hintLoading}
                onHint={handleHint}
                hintRef={hintRef}
                feedbackRef={feedbackRef}
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
                      className={`btn-quiz${quizLoading ? " is-loading" : ""}`}
                      onClick={() => loadQuiz(false)}
                      disabled={quizLoading}
                      type="button"
                    >
                      {quizLoading
                        ? "🎯 Building fresh questions…"
                        : "🎯 Test me on this lesson"}
                    </button>
                  </div>

                  {quizError && (
                    <div className="quiz-error">
                      <span>{quizError}</span>
                      <button
                        className="btn-secondary"
                        onClick={() => loadQuiz(true)}
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
                      onNew={() => loadQuiz(true)}
                      onReveal={(el) => revealIn(lessonPaneRef.current, el, 20)}
                    />
                  )}
                </div>
              </TaskFooter>
            </LessonPanel>
          </div>
        </div>

        <div className="work-pane" ref={workRef}>
          {(top.tab === "editor" || streaming || messages.length > 0) && (
            <div className="work-actions">
              <ActionBar {...actionProps} />
            </div>
          )}

          <div
            className="work-top"
            style={{
              flexGrow: top.tab === "assistant" ? 1 : top.split,
              flexBasis: 0,
            }}
          >
            <div
              className="tab-panel"
              id="panel-editor"
              role="tabpanel"
              aria-labelledby="tab-editor"
              hidden={top.tab !== "editor"}
            >
              <SqlEditor
                value={query}
                onChange={setQuery}
                onRun={handleRun}
                disabled={!ready || !query.trim()}
                schema={liveSchema}
                onFocusChange={setKeyboardOpen}
              />
            </div>
            <div
              className="tab-panel"
              id="panel-assistant"
              role="tabpanel"
              aria-labelledby="tab-assistant"
              hidden={top.tab !== "assistant"}
            >
              <ChatPanel
                messages={messages}
                streaming={streaming}
                active={top.tab === "assistant"}
                starters={chatStarters}
                onSend={handleSend}
              />
            </div>
          </div>

          <div
            className="pane-divider"
            role="separator"
            aria-orientation="horizontal"
            aria-label="Resize the editor and output panes"
            aria-valuenow={Math.round(top.split * 100)}
            aria-valuemin={25}
            aria-valuemax={75}
            tabIndex={0}
            title="Drag to resize · double-click to reset"
            onPointerDown={startDrag}
            onPointerMove={moveDrag}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onDoubleClick={() => setTop({ tab: top.tab, split: DEFAULT_SPLIT })}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                nudgeSplit(-0.04);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                nudgeSplit(0.04);
              }
            }}
          />

          <div
            className="pane-tabs pane-tabs-output"
            role="tablist"
            aria-label="Output"
          >
            <button
              role="tab"
              id="tab-results"
              aria-controls="panel-results"
              aria-selected={bottomTab === "results"}
              className={`pane-tab${bottomTab === "results" ? " active" : ""}`}
              onClick={() => setBottomTab("results")}
              type="button"
            >
              <Icon name="table" size={14} />
              Query results
            </button>
            <button
              role="tab"
              id="tab-database"
              aria-controls="panel-database"
              aria-selected={bottomTab === "database"}
              className={`pane-tab${bottomTab === "database" ? " active" : ""}`}
              onClick={() => setBottomTab("database")}
              type="button"
            >
              <Icon name="database" size={14} />
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

          <div
            className="work-bottom"
            style={{ flexGrow: 1 - top.split, flexBasis: 0 }}
          >
            <div
              className="tab-panel"
              id="panel-results"
              role="tabpanel"
              aria-labelledby="tab-results"
              hidden={bottomTab !== "results"}
            >
              <ResultTable response={response} />
            </div>
            <div
              className="tab-panel"
              id="panel-database"
              role="tabpanel"
              aria-labelledby="tab-database"
              hidden={bottomTab !== "database"}
            >
              <DatabaseTab schema={liveSchema} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
