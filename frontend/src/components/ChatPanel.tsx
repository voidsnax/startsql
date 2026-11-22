import { useCallback, useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import type { ChatMessage } from "../hooks/useChat";

interface Props {
  messages: ChatMessage[];
  streaming: boolean;
  active: boolean;
  starters: string[];
  onSend: (text: string) => void;
}

export function ChatPanel({
  messages,
  streaming,
  active,
  starters,
  onSend,
}: Props) {
  const [input, setInput] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const tailRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const prevLen = useRef(0);

  const sizeTail = useCallback(() => {
    const body = bodyRef.current;
    const tail = tailRef.current;
    if (!body || !tail) return;
    const anchor = anchorRef.current;
    if (!anchor) {
      tail.style.height = "0px";
      return;
    }
    const content = body.scrollHeight - tail.offsetHeight;
    const exchange = content - anchor.offsetTop;
    const reserve = Math.max(0, body.clientHeight - exchange - 16);
    tail.style.height = `${reserve}px`;
  }, []);

  useEffect(() => {
    sizeTail();
  }, [messages, active, sizeTail]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 92)}px`;
  }, [input]);

  const scrollToLatest = useCallback(() => {
    if (!active) return;
    const body = bodyRef.current;
    const anchor = anchorRef.current;
    if (!body || !anchor) return;
    body.scrollTop = Math.max(0, anchor.offsetTop - 8);
  }, [active]);

  useEffect(() => {
    const grew = messages.length > prevLen.current;
    prevLen.current = messages.length;
    if (grew) scrollToLatest();
  }, [messages, scrollToLatest]);

  useEffect(() => {
    if (active) scrollToLatest();
  }, [active, scrollToLatest]);

  useEffect(() => {
    const body = bodyRef.current;
    if (!body || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => sizeTail());
    ro.observe(body);
    return () => ro.disconnect();
  }, [sizeTail]);

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
              I can see your lesson, your tables, and the query you ran. Pick a
              starting point or ask your own.
            </p>
            <div className="chat-starters">
              {starters.map((s) => (
                <button
                  key={s}
                  className="chat-starter"
                  onClick={() => onSend(s)}
                  disabled={streaming}
                  type="button"
                >
                  {s}
                </button>
              ))}
            </div>
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
                <span className="chat-typing" aria-label="Assistant is typing">
                  <i />
                  <i />
                  <i />
                </span>
              )
            ) : (
              <Markdown>{m.content}</Markdown>
            )}
          </div>
        ))}
        {messages.length > 0 && (
          <div className="chat-tail" ref={tailRef} aria-hidden="true" />
        )}
      </div>
      <div className="chat-input-row">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Ask any questions…"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          className="btn-primary chat-send"
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
