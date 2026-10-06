import type { Lesson } from '../data/lessons';

interface Props {
  lesson: Lesson;
  currentTaskIndex: number;
  isTaskComplete: (taskId: string) => boolean;
  canCheck: boolean;
  failCount: number;
  feedback: { status: 'success' | 'fail'; message: string } | null;
  onCheckAnswer: () => void;
  onJumpToTask: (idx: number) => void;
  hasPrevLesson: boolean;
  hasNextLesson: boolean;
  canGoToNext: boolean;
  onPrevLesson: () => void;
  onNextLesson: () => void;
  isCurrentLessonComplete: boolean;
  onMarkComplete: () => void;
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
  hasPrevLesson,
  hasNextLesson,
  canGoToNext,
  onPrevLesson,
  onNextLesson,
  isCurrentLessonComplete,
  onMarkComplete,
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
                  className={`task-dot${
                    isTaskComplete(t.id) ? ' done' : ''
                  }${i === currentTaskIndex ? ' current' : ''}`}
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
              {isTaskComplete(currentTask.id) ? '✅ Completed' : '✓ Check Answer'}
            </button>
          </div>

          <div className="lesson-task-prompt">{currentTask.prompt}</div>

          {feedback && (
            <div className={`task-feedback task-feedback-${feedback.status}`}>
              {feedback.message}
            </div>
          )}

          {!feedback && failCount >= 3 && !isTaskComplete(currentTask.id) && (
            <div className="task-nudge">
              Tried a few times? Ask the assistant — describe what you tried
              and what happened.
            </div>
          )}
        </div>
      )}

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
                  ? 'Complete all tasks in this lesson to unlock'
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