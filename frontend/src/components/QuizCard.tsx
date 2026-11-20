import { useState } from "react";

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

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

const LETTERS = ["A", "B", "C", "D", "E", "F"];

interface Props {
  questions: QuizQuestion[];
  onClose: () => void;
  onRetry: () => void;
}

export function QuizCard({ questions, onClose, onRetry }: Props) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
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
      <div className="quiz-card">
        <div className="quiz-head">
          <span className="quiz-title">🎯 Result</span>
          <button className="quiz-close" onClick={onClose} type="button" aria-label="Close quiz">
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
            ↺ Retry these
          </button>
          <button className="btn-secondary" onClick={onRetry} type="button">
            ✨ New questions
          </button>
          <button className="btn-primary" onClick={onClose} type="button">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-card">
      <div className="quiz-head">
        <span className="quiz-title">
          🎯 Question {index + 1} of {questions.length}
        </span>
        <span className="quiz-progress" aria-hidden="true">
          {questions.map((_, i) => (
            <span
              key={i}
              className={`quiz-pip${i === index ? " current" : ""}${i < index ? " past" : ""}`}
            />
          ))}
        </span>
        <button className="quiz-close" onClick={onClose} type="button" aria-label="Close quiz">
          ✕
        </button>
      </div>

      <p className="quiz-q">{q.q}</p>

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
              <span className="quiz-letter">{LETTERS[i]}</span>
              <span className="quiz-option-text">{opt}</span>
              {picked !== null && i === q.answer && <span className="quiz-mark">✓</span>}
              {picked !== null && i === picked && i !== q.answer && (
                <span className="quiz-mark">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {picked !== null && (
        <>
          <p className={`quiz-why${picked === q.answer ? " ok" : ""}`}>
            {picked === q.answer ? "Correct. " : "Not quite. "}
            {q.why}
          </p>
          <div className="quiz-foot">
            <button className="btn-primary" onClick={next} type="button">
              {index + 1 >= questions.length ? "See result →" : "Next question →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}