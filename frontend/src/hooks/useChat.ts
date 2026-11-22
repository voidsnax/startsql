import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  kind?: 'query';
}

export interface ChatContext {
  lessonId: string;
  lessonTitle: string;
  lessonContent: string;
  schema?: string;
  taskPrompt?: string;
  taskNumber?: number;
  taskTotal?: number;
  editorQuery?: string;
  editorIsDefault?: boolean;
  lastExecutedQuery?: string;
  lastResult?: string;
  lastError?: string;
}

export type AiMode = 'chat' | 'hint' | 'review' | 'quiz';

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/chat';

const MAX_HISTORY = 6;

function contextFields(c: ChatContext) {
  return {
    lesson_id: c.lessonId,
    lesson_title: c.lessonTitle,
    lesson_content: c.lessonContent,
    schema: c.schema,
    task_prompt: c.taskPrompt,
    task_number: c.taskNumber,
    task_total: c.taskTotal,
    editor_query: c.editorQuery,
    editor_is_default: c.editorIsDefault,
    last_executed_query: c.lastExecutedQuery,
    last_result: c.lastResult,
    last_error: c.lastError,
  };
}

function friendly(err: unknown): string {
  const e = err as Error;
  if (e?.name === 'TypeError') return "Couldn't reach the assistant!";
  return e?.message || 'Something went wrong. Please try again.';
}

async function readStream(res: Response, onToken: (t: string) => void) {
  if (!res.ok) {
    throw new Error(
      res.status === 429
        ? "You're sending messages too quickly. Wait a moment and try again."
        : 'Something went wrong. Please try again.',
    );
  }
  if (!res.body) throw new Error('No response body');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      let payload: { type?: string; content?: string };
      try {
        payload = JSON.parse(line.slice(6));
      } catch {
        continue;
      }
      if (payload.type === 'token' && payload.content) onToken(payload.content);
      else if (payload.type === 'error')
        throw new Error(payload.content || 'The assistant hit an error.');
    }
  }
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  // One controller per silent mode, so a quiz never cancels a running hint.
  const askRef = useRef<{ hint?: AbortController; quiz?: AbortController }>({});

  useEffect(
    () => () => {
      abortRef.current?.abort();
      askRef.current.hint?.abort();
      askRef.current.quiz?.abort();
    },
    [],
  );

  const appendToLast = useCallback((chunk: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last && last.role === 'assistant') {
        copy[copy.length - 1] = { ...last, content: last.content + chunk };
      }
      return copy;
    });
  }, []);

  const replaceLast = useCallback((text: string) => {
    setMessages((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { role: 'assistant', content: text };
      return copy;
    });
  }, []);

  const send = useCallback(
    async (text: string, context: ChatContext, mode: AiMode = 'chat') => {
      if (streaming || !text.trim()) return;

      const outgoing: ChatMessage =
        mode === 'review'
          ? { role: 'user', content: text, kind: 'query' }
          : { role: 'user', content: text };

      const next: ChatMessage[] = [...messages, outgoing];
      setMessages([...next, { role: 'assistant', content: '' }]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: next
              .slice(-MAX_HISTORY)
              .map(({ role, content }) => ({ role, content })),
            mode,
            ...contextFields(context),
          }),
          signal: controller.signal,
        });
        await readStream(res, appendToLast);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') replaceLast(friendly(err));
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming, appendToLast, replaceLast],
  );

    /** Silent one-shot request — never touches the conversation. */
  const ask = useCallback(
    async (
      mode: 'hint' | 'quiz',
      context: ChatContext,
      onToken?: (t: string) => void,
    ): Promise<string> => {
      askRef.current[mode]?.abort();
      const controller = new AbortController();
      askRef.current[mode] = controller;

      let text = '';
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content:
                mode === 'hint'
                  ? 'Give me one hint for the current task.'
                  : 'Quiz me on this lesson.',
            },
          ],
          mode,
          ...contextFields(context),
        }),
        signal: controller.signal,
      });
      await readStream(res, (t) => {
        text += t;
        onToken?.(t);
      });
      return text;
    },
    [],
  );

  const clear = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  }, []);

  return { messages, streaming, send, ask, clear };
}