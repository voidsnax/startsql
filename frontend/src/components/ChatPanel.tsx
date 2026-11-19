import { useEffect, useRef, useState } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [messages, active]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    onSend(text);
  };

  return (
    <div className="chat-panel">
      <div className="chat-body" ref={scrollRef} onScroll={handleScroll}>
        {messages.length === 0 && (
          <div className="chat-empty">
            <p className="chat-empty-title">I'm here if you get stuck.</p>
            <p className="chat-empty-sub">
              Try a task on the left. If something doesn't work, ask me why.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg chat-msg-${m.role}`}>
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