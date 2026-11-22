import type { ReactNode, Ref } from "react";
import type { Lesson } from "../data/lessons";
import { Inline } from "./Markdown";
import { Icon } from "./Icon";

interface Props {
  lesson: Lesson;
  currentTaskIndex: number;
  isTaskComplete: (taskId: string) => boolean;
  canCheck: boolean;
  failCount: number;
  feedback: { status: "success" | "fail"; message: string } | null;
  onCheckAnswer: () => void;
  onJumpToTask: (idx: number) => void;
  authoredHint?: string;
  hintLevel: number;
  hintUnlocked: boolean;
  aiHint: string | null;
  hintLoading: boolean;
  onHint: () => void;
  hintRef: Ref<HTMLDivElement>;
  feedbackRef: Ref<HTMLDivElement>;
  hasPrevLesson: boolean;
  hasNextLesson: boolean;
  canGoToNext: boolean;
  onPrevLesson: () => void;
  onNextLesson: () => void;
  isCurrentLessonComplete: boolean;
  onMarkComplete: () => void;
  children?: ReactNode;
}

export function TaskFooter({
  lesson,
  currentTaskIndex,
  isTaskComplete,
  canCheck,
  failCount,
  feedback,
  onCheckAnswer,
  onJumpToTask,
  authoredHint,
  hintLevel,
  hintUnlocked,
  aiHint,
  hintLoading,
  onHint,
  hintRef,
  feedbackRef,
  hasPrevLesson,
  hasNextLesson,
  canGoToNext,
  onPrevLesson,
  onNextLesson,
  isCurrentLessonComplete,
  onMarkComplete,
  children,
}: Props) {
  const hasTasks = lesson.tasks.length > 0;
  const currentTask = hasTasks ? lesson.tasks[currentTaskIndex] : null;
  const showNav = hasPrevLesson || hasNextLesson;
  const showMarkComplete =
    !hasTasks && !hasNextLesson && !isCurrentLessonComplete;
  const done = currentTask ? isTaskComplete(currentTask.id) : false;

  return (
    <div className="lesson-tasks">
      {hasTasks && currentTask && (
        <div className="lesson-task-section">
          <div className="lesson-task-top">
            <span className="task-counter">
              Task {currentTaskIndex + 1} of {lesson.tasks.length}
            </span>
            <div className="task-dots">
              {lesson.tasks.map((t, i) => (
                <button
                  key={`${t.id}-${isTaskComplete(t.id) ? "done" : "todo"}`}
                  className={`task-dot${isTaskComplete(t.id) ? " done" : ""}${
                    i === currentTaskIndex ? " current" : ""
                  }`}
                  onClick={() => onJumpToTask(i)}
                  title={`Task ${i + 1}`}
                  type="button"
                  aria-label={`Go to task ${i + 1}`}
                />
              ))}
            </div>
            <button
              className="btn-primary btn-check"
              onClick={onCheckAnswer}
              disabled={!canCheck || done}
              title={
                done
                  ? "You have already completed this task"
                  : canCheck
                    ? "Compare your result with the expected one"
                    : "Run a query first"
              }
              type="button"
            >
              {done ? "✅ Completed" : "✓ Check Answer"}
            </button>
          </div>

          <div className="lesson-task-prompt">{currentTask.prompt}</div>

          <div className="task-ai-row">
            <button
              className="btn-hint"
              onClick={onHint}
              disabled={!hintUnlocked || hintLoading || done}
              title={
                hintUnlocked
                  ? "Show a hint for this task"
                  : "Run a query or check again to unlock the next hint"
              }
              type="button"
            >
              <Icon name={hintLevel === 0 ? "bulb" : "sparkles"} size={14} />
              {hintLoading ? "Thinking…" : "Hint"}
            </button>
            {!canCheck && !done && (
              <span className="check-hint">
                Run a query first to check your answer.
              </span>
            )}
          </div>

          {(feedback ||
            hintLevel >= 1 ||
            aiHint ||
            (failCount >= 4 && !done)) && (
            <div className="task-response" ref={feedbackRef}>
              {feedback && (
                <div
                  className={`task-feedback task-feedback-${feedback.status}`}
                >
                  {feedback.message}
                </div>
              )}

              {(hintLevel >= 1 || aiHint) && (
                <div ref={hintRef}>
                  {hintLevel >= 1 && authoredHint && (
                    <div className="task-hint">
                      <Inline text={authoredHint} />
                    </div>
                  )}
                  {aiHint && (
                    <div className="task-hint task-hint-ai">
                      <Inline text={aiHint} />
                    </div>
                  )}
                </div>
              )}

              {failCount >= 4 && !done && (
                <div className="task-nudge">
                  Still stuck? Ask the Assistant — it already sees your query
                  and the error.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {children}

      {(showNav || showMarkComplete) && (
        <div className="lesson-task-nav">
          {hasPrevLesson && (
            <button
              className="btn-secondary"
              onClick={onPrevLesson}
              type="button"
            >
              ← Previous lesson
            </button>
          )}
          <div className="lesson-task-nav-spacer" />
          {showMarkComplete && (
            <button
              className="btn-primary"
              onClick={onMarkComplete}
              type="button"
            >
              ✓ Mark lesson complete
            </button>
          )}
          {hasNextLesson && (
            <button
              className="btn-secondary btn-next"
              onClick={onNextLesson}
              disabled={!canGoToNext}
              title={
                !canGoToNext
                  ? "Complete all tasks in this lesson to unlock"
                  : undefined
              }
              type="button"
            >
              Next lesson →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
