import { useCallback, useRef, useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
  schema?: string;
  taskPrompt?: string;
  taskNumber?: number;
  taskTotal?: number;
  lastQuery?: string;
  lastResult?: string;
  lastError?: string;
}

const API_URL = 'http://localhost:8000/api/chat';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(
    async (text: string, context: ChatContext) => {
      if (streaming || !text.trim()) return;

      const userMessage: ChatMessage = { role: 'user', content: text };
      const nextMessages = [...messages, userMessage];
      setMessages([...nextMessages, { role: 'assistant', content: '' }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: nextMessages,
            lesson_id: context.lessonId,
            lesson_title: context.lessonTitle,
            lesson_content: context.lessonContent,
            schema: context.schema,
            task_prompt: context.taskPrompt,
            task_number: context.taskNumber,
            task_total: context.taskTotal,
            last_query: context.lastQuery,
            last_result: context.lastResult,
            last_error: context.lastError,
          }),
          signal: controller.signal,
        });

        if (!res.body) throw new Error('No response body');

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const payload = JSON.parse(line.slice(6));

            if (payload.type === 'token') {
              setMessages((prev) => {
                const copy = [...prev];
                const last = copy[copy.length - 1];
                if (last && last.role === 'assistant') {
                  copy[copy.length - 1] = {
                    ...last,
                    content: last.content + payload.content,
                  };
                }
                return copy;
              });
            } else if (payload.type === 'error') {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: 'assistant',
                  content: payload.content,
                };
                return copy;
              });
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: 'assistant',
              content: "Couldn't reach the assistant!",
            };
            return copy;
          });
        }
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming]
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  }, []);

  return { messages, streaming, send, clear };
}