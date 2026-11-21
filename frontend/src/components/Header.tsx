import { lessons } from "../data/lessons";
import type { Lesson } from "../data/lessons";
import { Logo } from "./Logo";
import { Icon } from "./Icon";

export type MobileView = "lesson" | "practice" | "assistant";
export type TopTab = "editor" | "assistant";

export interface ActionBarProps {
  topTab: TopTab;
  onRun: () => void;
  onReset: () => void;
  onClear: () => void;
  onReview: () => void;
  canRun: boolean;
  canReview: boolean;
  streaming: boolean;
  hasMessages: boolean;
  onClearChat: () => void;
}

export function ActionBar({
  topTab,
  onRun,
  onReset,
  onClear,
  onReview,
  canRun,
  canReview,
  streaming,
  hasMessages,
  onClearChat,
}: ActionBarProps) {
  if (topTab === "assistant") {
    return (
      <div className="action-bar">
        {streaming && <span className="chat-status">thinking…</span>}
        {hasMessages && !streaming && (
          <button
            className="icon-action"
            onClick={onClearChat}
            title="Clear conversation"
            aria-label="Clear conversation"
            type="button"
          >
            <Icon name="clear" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="action-bar">
      <button
        className="icon-action"
        onClick={onClear}
        disabled={!canRun}
        title="Clear editor"
        aria-label="Clear editor"
        type="button"
      >
        <Icon name="clear" />
      </button>
      <button
        className="icon-action accent-brand"
        onClick={onReset}
        title="Reset database to its original data"
        aria-label="Reset database"
        type="button"
      >
        <Icon name="rotate" />
      </button>
      <button
        className="icon-action accent-warn"
        onClick={onReview}
        disabled={!canReview}
        title="Review my SQL"
        aria-label="Review my SQL"
        type="button"
      >
        <Icon name="sparkles" />
      </button>
      <button
        className="icon-action is-primary"
        onClick={onRun}
        disabled={!canRun}
        title="Run query (Ctrl+Enter)"
        aria-label="Run query"
        type="button"
      >
        <Icon name="play" />
      </button>
    </div>
  );
}

interface Props {
  currentLesson: Lesson;
  onSelectLesson: (lesson: Lesson) => void;
  completedLessons: number;
  totalLessons: number;
  isLessonComplete: (lesson: Lesson) => boolean;
  onResetProgress: () => void;
  mobileView: MobileView;
  onMobileViewChange: (view: MobileView) => void;
  assistantDot: boolean;
  topTab: TopTab;
  onTopTabChange: (tab: TopTab) => void;
  actions: ActionBarProps;
}

const SEGMENTS: {
  id: MobileView;
  label: string;
  icon: "book" | "code" | "chat";
}[] = [
  { id: "lesson", label: "Lesson", icon: "book" },
  { id: "practice", label: "Practice", icon: "code" },
  { id: "assistant", label: "Assistant", icon: "chat" },
];

export function Header({
  currentLesson,
  onSelectLesson,
  completedLessons,
  totalLessons,
  isLessonComplete,
  onResetProgress,
  mobileView,
  onMobileViewChange,
  assistantDot,
  topTab,
  onTopTabChange,
  actions,
}: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <Logo size={30} />
          <div className="logo-text-group">
            <span className="logo-text">StartSQL</span>
            <span className="logo-tagline">Learn SQL. Practice. Ask.</span>
          </div>
        </div>

        <div className="picker topbar-picker">
          <span className="picker-icon">
            <Icon name="book" size={15} />
          </span>
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
          <span className="picker-chevron">
            <Icon name="chevron" size={15} />
          </span>
        </div>

        <div className="app-progress" title="Lessons completed">
          <strong>{completedLessons}</strong>
          <span className="app-progress-total">/{totalLessons}</span>
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
      </div>

      <div className="topbar-right">
        <div className="topbar-tabs" role="tablist" aria-label="Workspace">
          <button
            role="tab"
            id="tab-editor"
            aria-controls="panel-editor"
            aria-selected={topTab === "editor"}
            className={`topbar-tab${topTab === "editor" ? " active" : ""}`}
            onClick={() => onTopTabChange("editor")}
            type="button"
          >
            <Icon name="code" size={15} />
            Code editor
          </button>
          <button
            role="tab"
            id="tab-assistant"
            aria-controls="panel-assistant"
            aria-selected={topTab === "assistant"}
            className={`topbar-tab${topTab === "assistant" ? " active" : ""}`}
            onClick={() => onTopTabChange("assistant")}
            type="button"
          >
            <Icon name="chat" size={15} />
            Assistant
            {assistantDot && topTab !== "assistant" && (
              <span className="tab-dot" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="topbar-tail">
          {(topTab === "editor" ||
            actions.streaming ||
            actions.hasMessages) && (
            <span className="topbar-sep" aria-hidden="true" />
          )}
          <div className="topbar-actions">
            <ActionBar {...actions} />
          </div>
        </div>
      </div>

      <div className="mobile-segments" role="tablist" aria-label="View">
        {SEGMENTS.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={mobileView === s.id}
            className={`segment${mobileView === s.id ? " active" : ""}`}
            onClick={() => onMobileViewChange(s.id)}
            type="button"
          >
            <Icon name={s.icon} size={15} />
            {s.label}
            {s.id === "assistant" &&
              assistantDot &&
              mobileView !== "assistant" && (
                <span className="tab-dot" aria-hidden="true" />
              )}
          </button>
        ))}
      </div>
    </header>
  );
}
