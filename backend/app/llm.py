import asyncio

from openai import APIConnectionError, APIError, AsyncOpenAI, RateLimitError

from .config import BASE_URL, GROQ_API_KEY, MODEL_NAME

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url=BASE_URL,
)

SYSTEM_PROMPT = """You are a patient, friendly SQL tutor for absolute beginners.

Style:
- Explain in simple, plain language. Define any jargon you use.
- Keep answers under 120 words unless the student asks for more detail.
- Use short SQL examples when helpful.
- Stay on topic: SQL, databases, and the current lesson.

Tutoring behavior:
- For exercises, give a hint before the full solution.
- If the student explicitly asks for the solution, provide it with a brief explanation.
- When the student makes an error, first acknowledge what they got right.

Context you receive:
- Lesson content, database schema, the current task, what the student has typed in the editor, what they actually ran, and any error.
- The editor contains what the student has typed. The executed query is what they ran. Never claim they ran something that only appears in the editor.

How to use the context:
- Answer what the student asked, not what you assume they want.
- If they ask about a concept, explain the concept — don't push them back to the current task.
- Reference the task, query, or result only when their question is about it.
- If their question is unrelated to the task but related to the lesson, help with the lesson.

Hard limits:
- Never invent tables, columns, tasks, errors, or lesson content.
- Don't jump ahead to future lessons.
"""


def build_context_prefix(
    lesson_title: str | None,
    lesson_content: str | None,
    schema: str | None,
    task_prompt: str | None,
    task_number: int | None,
    task_total: int | None,
    editor_query: str | None,
    last_executed_query: str | None,
    last_result: str | None,
    last_error: str | None,
) -> str:
    parts: list[str] = []

    if lesson_title:
        parts.append(f"Current lesson: {lesson_title}")

    if lesson_content:
        parts.append(f"Lesson content:\n{lesson_content[:800]}")

    if schema:
        parts.append(f"Database schema:\n{schema[:800]}")

    if task_prompt:
        header = (
            f"Current task ({task_number} of {task_total}):"
            if task_number is not None and task_total is not None
            else "Current task:"
        )
        parts.append(f"{header}\n{task_prompt}")

    if editor_query:
        parts.append(
            f"What the student currently has typed in the editor "
            f"(NOT yet executed):\n{editor_query[:2000]}"
        )

    if last_executed_query:
        parts.append(
            f"The last query the student actually executed:\n"
            f"{last_executed_query[:2000]}"
        )

    if last_result:
        parts.append(f"Result of that executed query:\n{last_result[:2000]}")

    if last_error:
        parts.append(f"Error from that executed query:\n{last_error[:1000]}")

    if not parts:
        return ""

    return "[CONTEXT]\n" + "\n\n".join(parts) + "\n[/CONTEXT]\n\n"


def _to_openai_messages(
    messages: list[dict],
    context_prefix: str,
) -> list[dict]:
    """Convert our messages to OpenAI chat format.

    Injects the context prefix into the *last* user turn.
    """
    out: list[dict] = []
    for i, msg in enumerate(messages):
        role = "user" if msg["role"] == "user" else "assistant"
        content = msg["content"] or ""

        if i == len(messages) - 1 and role == "user" and context_prefix:
            content = context_prefix + content

        out.append({"role": role, "content": content})
    return out


async def _stream_with_retry(
    messages: list[dict],
    system_prompt: str,
    max_retries: int = 3,
):
    """Stream tokens from Groq with retry on transient errors."""
    delay = 1.0
    for attempt in range(max_retries + 1):
        yielded_any = False
        try:
            stream = await client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *messages, # type: ignore
                ],
                temperature=0.5,
                stream=True,
            ) # type: ignore
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    yielded_any = True
                    yield chunk.choices[0].delta.content
            return
        except (RateLimitError, APIConnectionError, APIError) as e:
            msg = str(e)
            is_transient = any(
                token in msg
                for token in ("503", "UNAVAILABLE", "500", "INTERNAL", "429")
            )
            if not is_transient or yielded_any or attempt == max_retries:
                raise
            print(f"[llm] transient error (attempt {attempt + 1}): {e}")
            await asyncio.sleep(delay)
            delay *= 2


async def stream_chat(
    messages: list[dict],
    lesson_title: str | None = None,
    lesson_content: str | None = None,
    schema: str | None = None,
    task_prompt: str | None = None,
    task_number: int | None = None,
    task_total: int | None = None,
    editor_query: str | None = None,
    last_executed_query: str | None = None,
    last_result: str | None = None,
    last_error: str | None = None,
):
    if not messages:
        raise ValueError("At least one message is required.")

    context_prefix = build_context_prefix(
        lesson_title=lesson_title,
        lesson_content=lesson_content,
        schema=schema,
        task_prompt=task_prompt,
        task_number=task_number,
        task_total=task_total,
        editor_query=editor_query,
        last_executed_query=last_executed_query,
        last_result=last_result,
        last_error=last_error,
    )

    openai_messages = _to_openai_messages(messages, context_prefix)

    async for chunk in _stream_with_retry(openai_messages, SYSTEM_PROMPT):
        yield chunk