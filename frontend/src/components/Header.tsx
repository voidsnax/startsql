import { lessons } from "../data/lessons";
import type { Lesson } from "../data/lessons";
import { Logo } from "./Logo";

interface Props {
  currentLesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
  completedLessons: number;
  totalLessons: number;
  isLessonComplete: (lesson: Lesson) => boolean;
  onResetProgress: () => void;
}

export function Header({
  currentLesson,
  onSelectLesson,
  completedLessons,
  totalLessons,
  isLessonComplete,
  onResetProgress,
}: Props) {
  return (
    <header className="app-header">
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
        Lessons: <strong>{completedLessons}</strong> / {totalLessons}
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
