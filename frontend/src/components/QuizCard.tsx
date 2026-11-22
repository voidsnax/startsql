import { useEffect, useRef, useState } from "react";
import { Inline } from "./Markdown";
import { Icon } from "./Icon";
import type { QuizQuestion } from "../data/quizzes";

export type { QuizQuestion };

export function parseQuiz(raw: string): QuizQuestion[] | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(raw.slice(start, end + 1));
    const list = data?.questions;
    if (!Array.isArray(list)) return null;
    const clean: QuizQuestion[] = [];
    for (const item of list) {
      if (
        typeof item?.q === "string" &&
        Array.isArray(item?.options) &&
        item.options.length >= 2 &&
        Number.isInteger(item?.answer) &&
        item.answer >= 0 &&
        item.answer < item.options.length
      ) {
        clean.push({
          q: item.q,
          options: item.options.map((o: unknown) => String(o)),
          answer: item.answer,
          why: typeof item.why === "string" ? item.why : "",
        });
      }
    }
    return clean.length > 0 ? clean : null;
  } catch {
    return null;
  }
}

interface Props {
  questions: QuizQuestion[];
  onClose: () => void;
  onNew: () => void;
  onReveal: (el: HTMLElement | null) => void;
}

export function QuizCard({ questions, onClose, onNew, onReveal }: Props) {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(number | null)[]>(() =>
    questions.map(() => null),
  );
  const [finished, setFinished] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLParagraphElement>(null);
  const footRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIndex(0);
    setPicks(questions.map(() => null));
    setFinished(false);
  }, [questions]);

  const q = questions[index];
  const picked = picks[index];
  const score = picks.reduce<number>(
    (n, p, i) => (p !== null && p === questions[i].answer ? n + 1 : n),
    0,
  );

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicks((prev) => {
      const next = [...prev];
      next[index] = i;
      return next;
    });
    requestAnimationFrame(() => onReveal(footRef.current));
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      requestAnimationFrame(() => onReveal(cardRef.current));
      return;
    }
    setIndex((i) => i + 1);
    requestAnimationFrame(() => onReveal(questionRef.current));
  };

  const restart = () => {
    setIndex(0);
    setPicks(questions.map(() => null));
    setFinished(false);
    requestAnimationFrame(() => onReveal(cardRef.current));
  };

  if (finished) {
    const pct = score / questions.length;
    const verdict =
      pct === 1
        ? "Perfect — you own this lesson."
        : pct >= 0.75
          ? "Solid. One more pass and it's yours."
          : pct >= 0.5
            ? "Getting there — reread the examples above."
            : "Worth another read of the lesson, then retry.";

    return (
      <div className="quiz-card" ref={cardRef}>
        <div className="quiz-head">
          <span className="quiz-title">Result</span>
          <button
            className="quiz-close"
            onClick={onClose}
            type="button"
            aria-label="Close quiz"
          >
            ✕
          </button>
        </div>
        <div className="quiz-score">
          <strong>{score}</strong>
          <span>/ {questions.length}</span>
        </div>
        <p className="quiz-verdict">{verdict}</p>
        <div className="quiz-foot">
          <button className="btn-secondary" onClick={restart} type="button">
            <Icon name="rotate" size={14} /> Retry these
          </button>
          <button className="btn-secondary" onClick={onNew} type="button">
            <Icon name="sparkles" size={14} /> New questions
          </button>
          <button className="btn-primary" onClick={onClose} type="button">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-card" ref={cardRef}>
      <div className="quiz-head">
        <span className="quiz-title">
          Question {index + 1} of {questions.length}
        </span>
        <span className="quiz-progress" aria-hidden="true">
          {questions.map((_, i) => {
            const p = picks[i];
            const state =
              p === null
                ? i === index
                  ? " current"
                  : ""
                : p === questions[i].answer
                  ? " ok"
                  : " bad";
            return <span key={i} className={`quiz-pip${state}`} />;
          })}
        </span>
        <button
          className="quiz-close"
          onClick={onClose}
          type="button"
          aria-label="Close quiz"
        >
          ✕
        </button>
      </div>
      <p className="quiz-q" ref={questionRef}>
        <Inline text={q.q} />
      </p>

      <div className="quiz-options">
        {q.options.map((opt, i) => {
          const state =
            picked === null
              ? ""
              : i === q.answer
                ? " correct"
                : i === picked
                  ? " wrong"
                  : " dim";
          return (
            <button
              key={i}
              className={`quiz-option${state}`}
              onClick={() => pick(i)}
              disabled={picked !== null}
              type="button"
            >
              <span className="quiz-letter">{String.fromCharCode(65 + i)}</span>
              <span className="quiz-option-text">
                <Inline text={opt} />
              </span>
              {picked !== null && i === q.answer && (
                <span className="quiz-mark">✓</span>
              )}
              {picked !== null && i === picked && i !== q.answer && (
                <span className="quiz-mark">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <div ref={footRef}>
          <p className={`quiz-why${picked === q.answer ? " ok" : ""}`}>
            {picked === q.answer ? "Correct. " : "Not quite. "}
            <Inline text={q.why} />
          </p>
          <div className="quiz-foot">
            <button className="btn-primary" onClick={next} type="button">
              {index + 1 >= questions.length
                ? "See result →"
                : "Next question →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
