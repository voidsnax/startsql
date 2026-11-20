import type { ReactNode, Ref } from "react";
import type { Lesson } from "../data/lessons";

interface Props {
  lesson: Lesson;
  currentTaskIndex: number;
  isTaskComplete: (taskId: string) => boolean;
  canCheck: boolean;
  failCount: number;
  feedback: { status: "success" | "fail"; message: string } | null;
  onCheckAnswer: () => void;
  onJumpToTask: (idx: number) => void;
  staticHintVisible: boolean;
  aiHint: string | null;
  hintLoading: boolean;
  onHint: () => void;
  hintRef: Ref<HTMLDivElement>;
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
  staticHintVisible,
  aiHint,
  hintLoading,
  onHint,
  hintRef,
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
                  key={t.id}
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
              disabled={!canCheck || isTaskComplete(currentTask.id)}
              type="button"
            >
              {isTaskComplete(currentTask.id)
                ? "✅ Completed"
                : "✓ Check Answer"}
            </button>
          </div>

          <div className="lesson-task-prompt">{currentTask.prompt}</div>

          <div className="task-ai-row">
            <button
              className="btn-hint"
              onClick={onHint}
              disabled={hintLoading || isTaskComplete(currentTask.id)}
              type="button"
            >
              {hintLoading
                ? "✨ Thinking…"
                : staticHintVisible
                  ? "✨ Another hint (AI)"
                  : "💡 Hint"}
            </button>
          </div>

          {feedback && (
            <div className={`task-feedback task-feedback-${feedback.status}`}>
              {feedback.message}
            </div>
          )}

          {(staticHintVisible || aiHint) && (
            <div ref={hintRef}>
              {staticHintVisible && currentTask.hint && (
                <div className="task-hint">{currentTask.hint}</div>
              )}
              {aiHint && <div className="task-hint task-hint-ai">{aiHint}</div>}
            </div>
          )}

          {failCount >= 4 && !isTaskComplete(currentTask.id) && (
            <div className="task-nudge">
              Tried a few times? Ask the assistant — describe what you tried and
              what happened.
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
