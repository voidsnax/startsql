import { lessons } from "../data/lessons";
import type { Lesson } from "../data/lessons";
import { Logo } from "./Logo";

export type MobileView = "lesson" | "practice";

interface Props {
  currentLesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
  completedLessons: number;
  totalLessons: number;
  isLessonComplete: (lesson: Lesson) => boolean;
  onResetProgress: () => void;
  mobileView: MobileView;
  onMobileViewChange: (view: MobileView) => void;
  practiceDot: boolean;
}

export function Header({
  currentLesson,
  onSelectLesson,
  completedLessons,
  totalLessons,
  isLessonComplete,
  onResetProgress,
  mobileView,
  onMobileViewChange,
  practiceDot,
}: Props) {
  return (
    <header className="lesson-topbar">
      <div className="view-switch" role="tablist" aria-label="View">
        <button
          role="tab"
          aria-selected={mobileView === "lesson"}
          className={`view-switch-btn${mobileView === "lesson" ? " active" : ""}`}
          onClick={() => onMobileViewChange("lesson")}
          type="button"
        >
          Lesson
        </button>
        <button
          role="tab"
          aria-selected={mobileView === "practice"}
          className={`view-switch-btn${mobileView === "practice" ? " active" : ""}`}
          onClick={() => onMobileViewChange("practice")}
          type="button"
        >
          Practice
          {practiceDot && mobileView === "lesson" && (
            <span className="tab-dot" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="app-logo">
        <Logo size={28} />
        <div className="logo-text-group">
          <span className="logo-text">StartSQL</span>
          <span className="logo-tagline">Learn SQL. Practice. Ask.</span>
        </div>
      </div>

      <select
        className="lesson-select"
        value={currentLesson.id}
        onChange={(e) => {
          const next = lessons.find((l) => l.id === e.target.value);
          if (next) onSelectLesson(next);
        }}
        aria-label="Select lesson"
      >
        {lessons.map((l) => (
          <option key={l.id} value={l.id}>
            {isLessonComplete(l) ? "✓ " : ""}
            {l.number}. {l.title}
          </option>
        ))}
      </select>

      <div className="app-progress" title="Lessons completed">
        <strong>{completedLessons}</strong> / {totalLessons}
        {completedLessons > 0 && (
          <button
            className="progress-reset"
            onClick={() => {
              if (confirm("Reset all progress? This cannot be undone.")) {
                onResetProgress();
              }
            }}
            title="Reset progress"
            type="button"
          >
            ↺
          </button>
        )}
      </div>
    </header>
  );
}