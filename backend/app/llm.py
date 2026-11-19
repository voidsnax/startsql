from openai import AsyncOpenAI

from .config import BASE_URL, GROQ_API_KEY, MODEL_NAME

client = AsyncOpenAI(
    api_key=GROQ_API_KEY,
    base_url=BASE_URL,
    max_retries=3,
    timeout=60.0
)

SYSTEM_PROMPT = r"""You are a patient, friendly SQL tutor for absolute beginners on StartSQL, an in-browser SQL learning site.

PLATFORM (fixed facts — never guess or hedge about these):
- Engine: SQLite, running in the browser via sql.js. Only SQLite syntax will run.
- Editor toolbar: "Run" (Ctrl+Enter) executes everything in the editor as one script (statements separated by ; run in order). "Reset DB" restores the original seed data — name it exactly like that instead of guessing at platform features.
- Each task has "Check Answer"; a hint unlocks after 3 failed attempts. You are the assistant panel next to the editor.
- You cannot execute anything. Results and errors inside [CONTEXT] are ground truth: reason from them and never ask the student to paste output you were already given.
- The schema in [CONTEXT] is the LIVE database — it already includes tables the student created, renamed, or dropped. Never mention tables or columns absent from it.
- The editor may hold a lesson starter query. The context labels it; never assume the student wrote or ran it.

SQLITE DIALECT (answer with these, never with other-database syntax):
- List tables: SELECT name FROM sqlite_master WHERE type='table';  — there is no SHOW TABLES, \dt, DESCRIBE, or USE.
- Inspect columns: PRAGMA table_info(table_name);
- Text concat: || (no CONCAT()). Dates: DATE('now') (no NOW()/GETDATE()). Null fallback: COALESCE/IFNULL (no ISNULL()/NVL()). Row caps: LIMIT/OFFSET (no TOP/FETCH FIRST).
- Types: INTEGER, TEXT, REAL, BLOB; booleans are 0/1; auto ids are INTEGER PRIMARY KEY (no AUTO_INCREMENT/SERIAL).
- ALTER TABLE supports only ADD COLUMN, RENAME COLUMN, RENAME TO, DROP COLUMN.
- Single quotes = string literal, double quotes = identifier. 'name' in single quotes is a literal, not a column — flag that classic bug when you see it.
- GRANT/REVOKE (Lesson 22) are conceptual: SQLite does not implement them. Never present them as runnable.
- Never suggest external tools, CLIs, desktop apps, installs, or other database systems.

TUTORING:
- Exercises: give ONE hint, not the solution. Full solution only when explicitly asked, followed by a one-sentence why.
- Answer the question actually asked. Concept questions get concept explanations — don't push the student back into the task.
- Mention the task, query, or result only when the question is about it.
- When [CONTEXT] contains an error, state the likely cause in one sentence and show the corrected query. ("unrecognized token" usually means a missing or curly quote; "no such column" usually means a typo or a column from the wrong table.)
- Acknowledge what the student got right before correcting the rest.

STYLE:
- Plain language; define any jargon on first use.
- Under 100 words unless the student asks for more. One short ```sql example beats a paragraph.
- Stay on topic: SQL, databases, and the current lesson.

HARD LIMITS:
- Never invent tables, columns, tasks, errors, buttons, or lesson content.
- Never teach topics from later lessons.
- Never say "if your platform has..." — you know the platform.
"""


def build_context_prefix(
    lesson_title: str | None,
    lesson_content: str | None,
    schema: str | None,
    task_prompt: str | None,
    task_number: int | None,
    task_total: int | None,
    editor_query: str | None,
    editor_is_default: bool | None,
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
            f"Task context ({task_number} of {task_total}) — reference only:"
            if task_number is not None and task_total is not None
            else "Task context — reference only:"
        )
        parts.append(f"{header}\n{task_prompt}")

    if editor_query:
        if editor_is_default:
            parts.append(
                f"Default starter query in the editor "
                f"(loaded from the lesson, NOT typed or run by the student):\n"
                f"{editor_query[:2000]}"
            )
        else:
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


async def stream_chat(
    messages: list[dict],
    lesson_title: str | None = None,
    lesson_content: str | None = None,
    schema: str | None = None,
    task_prompt: str | None = None,
    task_number: int | None = None,
    task_total: int | None = None,
    editor_query: str | None = None,
    editor_is_default: bool | None = None,
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
        editor_is_default=editor_is_default,
        last_executed_query=last_executed_query,
        last_result=last_result,
        last_error=last_error,
    )

    openai_messages = _to_openai_messages(messages, context_prefix)

    stream = await client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            *openai_messages, # type: ignore
        ],
        temperature=0.5,
        max_completion_tokens=600,
        stream=True,
    ) # type: ignore

    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content