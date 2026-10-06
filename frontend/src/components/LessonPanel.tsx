import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import type { Lesson } from '../data/lessons';
import type { DatabaseDef } from '../data/schemas';
import { SchemaPreview } from './SchemaPreview';

interface Props {
  lesson: Lesson;
  database: DatabaseDef;
  collapsed: boolean;
  onToggle: () => void;
  children?: ReactNode;
}

export function LessonPanel({ lesson, database, collapsed, onToggle, children }: Props) {
  if (collapsed) {
    return (
      <button
        className="lesson-panel-collapsed"
        onClick={onToggle}
        type="button"
        aria-label="Expand lesson"
      >
        <span className="lesson-collapsed-chevron">▶</span>
        <span className="lesson-collapsed-eyebrow">Lesson {lesson.number}</span>
        <span className="lesson-collapsed-title">{lesson.title}</span>
        <span className="lesson-collapsed-hint">Show lesson</span>
      </button>
    );
  }

  const showSchema = lesson.showSchema === true;

  return (
    <section className="lesson-panel">
      <div className="lesson-header">
        <div className="lesson-eyebrow">Lesson {lesson.number}</div>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-subtitle">{lesson.subtitle}</div>
      </div>

      <div className="lesson-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={{
            code({ className, children, ...props }) {
              const isInline = !className;
              return isInline ? (
                <code className="md-inline-code" {...props}>
                  {children}
                </code>
              ) : (
                <pre className="md-code-block">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              );
            },
          }}
        >
          {lesson.content}
        </ReactMarkdown>

        {lesson.didYouKnow && (
          <div className="did-you-know">
            <div className="did-you-know-heading">💡 Did you know?</div>
            <div className="did-you-know-body">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
              >
                {lesson.didYouKnow}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {showSchema && <SchemaPreview database={database} />}
      </div>

      {children}
    </section>
  );
}