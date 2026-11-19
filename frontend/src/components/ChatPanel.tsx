import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import type { ChatMessage } from "../hooks/useChat";

interface Props {
  messages: ChatMessage[];
  streaming: boolean;
  active: boolean;
  onSend: (text: string) => void;
}

export function ChatPanel({ messages, streaming, active, onSend }: Props) {
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const prevLen = useRef(0);

  const scrollToLatest = useCallback(() => {
    if (!active) return;
    const body = bodyRef.current;
    const anchor = anchorRef.current;
    if (!body || !anchor) return;
    body.scrollTop = Math.max(0, anchor.offsetTop - 8);
  }, [active]);

  // One scroll per exchange — never while tokens arrive.
  useEffect(() => {
    const grew = messages.length > prevLen.current;
    prevLen.current = messages.length;
    if (grew) scrollToLatest();
  }, [messages, scrollToLatest]);

  useEffect(() => {
    if (active) scrollToLatest();
  }, [active, scrollToLatest]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    onSend(text);
  };

  const lastUserIndex = messages.findLastIndex((m) => m.role === "user");

  return (
    <div className="chat-panel">
      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty-title">I'm here if you get stuck.</p>
            <p className="chat-empty-sub">
              Try a task on the left. If something doesn't work, ask me why.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            ref={i === lastUserIndex ? anchorRef : undefined}
            className={`chat-msg chat-msg-${m.role}`}
          >
            {m.role === "assistant" ? (
              m.content ? (
                <Markdown>{m.content}</Markdown>
              ) : (
                <span className="chat-typing">…</span>
              )
            ) : (
              m.content
            )}
          </div>
        ))}
        {messages.length > 0 && <div className="chat-tail" aria-hidden="true" />}
      </div>
      <div className="chat-input-row">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask any questions…"
          rows={2}
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          className="btn-primary"
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}