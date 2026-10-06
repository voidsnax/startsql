import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "../hooks/useChat";
import type { ChatContext } from "../hooks/useChat";

interface Props {
  context: ChatContext;
  collapsed: boolean;
  onToggle: () => void;
}

export function ChatPanel({ context, collapsed, onToggle }: Props) {
  const { messages, streaming, send, clear } = useChat();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    send(text, context);
  };

  if (collapsed) {
    return (
      <button
        className="chat-strip"
        onClick={onToggle}
        type="button"
        title="Open assistant"
      >
        <span className="chat-strip-icon">◈</span>
        <span className="chat-strip-label">Assistant</span>
      </button>
    );
  }

  const showClear = messages.length > 0 && !streaming;

  return (
    <aside className="chat-panel">
      <div className="chat-header">
        <span className="chat-title">
          <span className="chat-title-mark">◈</span> Assistant
        </span>
        {streaming && <span className="chat-status">thinking…</span>}
        <div className="chat-header-right">
          {showClear && (
            <button className="chat-clear-btn" onClick={clear}>
              Clear
            </button>
          )}
          <button
            className="chat-collapse-btn"
            onClick={onToggle}
            title="Collapse assistant"
            type="button"
          >
            ›
          </button>
        </div>
      </div>

      <div className="chat-body" ref={scrollRef}>
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
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
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
                  {m.content}
                </ReactMarkdown>
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
          disabled={streaming}
        />
        <button
          onClick={handleSend}
          disabled={streaming || !input.trim()}
          className="btn-primary"
        >
          Send
        </button>
      </div>
    </aside>
  );
}
