import type { ReactNode } from "react";
import type { Lesson } from "../data/lessons";
import type { DatabaseDef } from "../data/schemas";
import { Markdown } from "./Markdown";
import { SchemaPreview } from "./SchemaPreview";

interface Props {
  lesson: Lesson;
  database: DatabaseDef;
  children?: ReactNode;
}

export function LessonPanel({ lesson, database, children }: Props) {
  const showSchema = lesson.showSchema === true;

  return (
    <section className="lesson-panel">
      <div className="lesson-header">
        <div className="lesson-eyebrow">Lesson {lesson.number}</div>
        <h1 className="lesson-title">{lesson.title}</h1>
        <div className="lesson-subtitle">{lesson.subtitle}</div>
      </div>

      <div className="lesson-body">
        <Markdown>{lesson.content}</Markdown>

        {lesson.didYouKnow && (
          <div className="did-you-know">
            <div className="did-you-know-heading">💡 Did you know?</div>
            <div className="did-you-know-body">
              <Markdown>{lesson.didYouKnow}</Markdown>
            </div>
          </div>
        )}

        {showSchema && <SchemaPreview database={database} />}
      </div>

      {children}
    </section>
  );
}
