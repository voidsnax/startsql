import time

from google import genai
from google.genai import types

from .config import GEMINI_API_KEY, MODEL_NAME

client = genai.Client(api_key=GEMINI_API_KEY)

SYSTEM_PROMPT = """You are a patient, friendly SQL tutor sitting beside a beginner.

Rules:
- Explain in simple, plain language. Avoid jargon. Define terms when needed.
- For exercises, give a hint before the full solution.
- If the student explicitly asks for the solution, provide it with a brief explanation.
- When the student makes an error, first acknowledge what they got right.
- Keep answers under 120 words unless the student asks for more detail.
- Use short SQL examples when helpful.
- Stay focused on SQL, databases, and the current lesson.
- Use the supplied lesson, schema, current task, query, result, and error as context.
- Never invent tables, columns, errors, or lesson content.

You are context-aware: if the student is working on a specific task, focus your help on that task. Don't jump ahead to future lessons.
"""


def build_context_prefix(
    lesson_title: str | None,
    lesson_content: str | None,
    schema: str | None,
    task_prompt: str | None,
    task_number: int | None,
    task_total: int | None,
    last_query: str | None,
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

    if last_query:
        parts.append(f"Student's last SQL query:\n{last_query[:2000]}")

    if last_result:
        parts.append(f"Query result:\n{last_result[:2000]}")

    if last_error:
        parts.append(f"Error the student saw:\n{last_error[:1000]}")

    if not parts:
        return ""

    return "[CONTEXT]\n" + "\n\n".join(parts) + "\n[/CONTEXT]\n\n"


def _to_contents(messages: list[dict]) -> list[types.Content]:
    contents: list[types.Content] = []
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        text = msg["content"] or ""
        contents.append(
            types.Content(role=role, parts=[types.Part(text=text)])
        )
    return contents


def _stream_with_retry(contents, config, max_retries: int = 3):
    delay = 1.0
    for attempt in range(max_retries + 1):
        yielded_any = False
        try:
            stream = client.models.generate_content_stream(
                model=MODEL_NAME,
                contents=contents,
                config=config,
            )
            for chunk in stream:
                if chunk.text:
                    yielded_any = True
                    yield chunk.text
            return
        except Exception as e:
            msg = str(e)
            is_transient = any(
                token in msg for token in ("503", "UNAVAILABLE", "500", "INTERNAL")
            )
            if not is_transient or yielded_any or attempt == max_retries:
                raise
            print(f"[llm] transient error (attempt {attempt + 1}): {e}")
            time.sleep(delay)
            delay *= 2


def stream_chat(
    messages: list[dict],
    lesson_title: str | None = None,
    lesson_content: str | None = None,
    schema: str | None = None,
    task_prompt: str | None = None,
    task_number: int | None = None,
    task_total: int | None = None,
    last_query: str | None = None,
    last_result: str | None = None,
    last_error: str | None = None,
):
    if not messages:
        raise ValueError("At least one message is required.")

    contents = _to_contents(messages)

    context_prefix = build_context_prefix(
        lesson_title=lesson_title,
        lesson_content=lesson_content,
        schema=schema,
        task_prompt=task_prompt,
        task_number=task_number,
        task_total=task_total,
        last_query=last_query,
        last_result=last_result,
        last_error=last_error,
    )

    if context_prefix and contents[-1].role == "user":
        user_text = contents[-1].parts[0].text or "" # type: ignore
        contents[-1] = types.Content(
            role="user",
            parts=[types.Part(text=context_prefix + user_text)],
        )

    config = types.GenerateContentConfig(
        system_instruction=SYSTEM_PROMPT,
        temperature=0.5,
    )

    yield from _stream_with_retry(contents, config)