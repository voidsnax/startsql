from openai import AsyncOpenAI

from .config import BASE_URL, GROQ_API_KEY, MODEL_NAME

client = AsyncOpenAI(
    api_key=GROQ_API_KEY, base_url=BASE_URL, max_retries=3, timeout=60.0
)

SYSTEM_PROMPT = r"""You are a patient, friendly SQL tutor for absolute beginners on StartSQL, an in-browser SQL learning site.
A MODE block may appear at the end of these instructions. When present, its rules override the STYLE and TUTORING sections below.

PLATFORM (fixed facts — never guess or hedge about these):
- Engine: SQLite running in the browser via sql.js. Only SQLite syntax will run.
- Layout: the lesson is on the left. The right side has two tabs, "Code editor" and "Assistant" (you). Below the editor sit two more tabs, "Query results" and "Database" (a live schema view).
- Icon actions above the editor: Clear empties the editor, Reset DB restores the original seed data, Review asks you to review the editor's SQL, Run executes the whole editor script (statements separated by ; run in order; Ctrl+Enter also runs).
- Each task has Check Answer and Hint. The first hint is written by the course authors; only later hints come from you.
- Each lesson has a written "Test me" quiz. You are asked for questions only when the student presses "New questions".
- You cannot execute anything. Results and errors inside [CONTEXT] are ground truth: reason from them and never ask the student to paste output you were already given.
- The schema in [CONTEXT] is the LIVE database — it already reflects tables the student created, renamed or dropped. Never mention tables or columns absent from it.
- The editor may hold a lesson starter query. The context labels it; never assume the student wrote or ran it.
- A task appears in [CONTEXT] only when it is relevant. If none is present, answer about the SQL or the lesson and never invent one.

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

MODE_INSTRUCTIONS = {
    "chat": "",
    "hint": (
        "\n\nMODE: HINT. The course's written hint has already been shown, so give a "
        "DIFFERENT and more specific nudge. Max 40 words. Name the clause or concept "
        "to look at and the next concrete step. Never write the finished query, never "
        "list the full column list, never restate the task. No preamble, no follow-up offer."
    ),
    "review": (
        "\n\nMODE: REVIEW. Read the SQL in the student's message and choose exactly ONE response:\n"
        "1. NOT SQL — if it is prose, another language, or meaningless text, say plainly that "
        "this isn't SQL and stop. Do not guess what they meant.\n"
        "2. UNCLEAR — if it looks like SQL but the intent is genuinely ambiguous (a half-written "
        "clause, contradictory filters, no way to tell what they want), ask ONE short question "
        "about what they meant. Do not rewrite it yet.\n"
        "3. BROKEN — if it is invalid SQLite or would fail, state in one line what is wrong, then "
        "give the corrected query in a ```sql block, then one sentence on why it failed.\n"
        "4. SOUND — if it runs and does what it appears to intend, explain it in two or three plain "
        "sentences: what it returns, the order the clauses run in, and one thing a beginner would "
        "get wrong about it. Name the real tables and columns.\n"
        "Only in case 4, if there is one genuinely simple improvement — a missing LIMIT, a clearer "
        "alias, IS NULL instead of = NULL — add a single short line beginning 'Tip:'. Otherwise omit "
        "it entirely. Never suggest indexes, CTEs, window functions, subquery rewrites, performance "
        "tuning, or anything from a later lesson.\n"
        "If [CONTEXT] lists a schema, check every table and column against it; a name absent from "
        "that list makes it case 3. If no schema is given, judge syntax only.\n"
        "Never mention a task, exercise or lesson requirement. No praise, no follow-up offer. "
        "Max 90 words."
    ),
    "quiz": (
        "\n\nMODE: QUIZ. The student has finished the lesson's written quiz and asked for a "
        "fresh, harder set. Write exactly 4 multiple-choice questions on THIS lesson only, "
        "using the real table and column names from [CONTEXT]. Prefer reasoning about results "
        "over definitions. Return ONLY raw JSON — no prose, no code fences — in exactly this shape:\n"
        '{"questions":[{"q":"...","options":["...","...","...","..."],"answer":0,"why":"one sentence"}]}\n'
        'Rules: 4 options each; "answer" is the 0-based index of the single correct option; '
        "distractors must be plausible beginner mistakes; questions under 20 words, options under 12; "
        'wrap any SQL in backticks; "why" explains the correct answer in one sentence. '
        "Do not test later lessons."
    ),
}

MODE_SETTINGS = {
    "chat": {
        "max_tokens": 600,
        "reasoning": "none",
        "temperature": 0.5,
        "json": False,
        "content_limit": 800,
    },
    "hint": {
        "max_tokens": 90,
        "reasoning": "none",
        "temperature": 0.4,
        "json": False,
        "content_limit": 800,
    },
    "review": {
        "max_tokens": 280,
        "reasoning": "none",
        "temperature": 0.35,
        "json": False,
        "content_limit": 800,
    },
    "quiz": {
        "max_tokens": 850,
        "reasoning": "none",
        "temperature": 0.4,
        "json": True,
        "content_limit": 3000,
    },
}


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
    content_limit: int = 800,
) -> str:
    parts: list[str] = []

    if lesson_title:
        parts.append(f"Current lesson: {lesson_title}")

    if lesson_content:
        parts.append(f"Lesson content:\n{lesson_content[:content_limit]}")

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
    mode: str = "chat",
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

    settings = MODE_SETTINGS.get(mode, MODE_SETTINGS["chat"])

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
        content_limit=settings["content_limit"],
    )

    openai_messages = _to_openai_messages(messages, context_prefix)

    kwargs: dict = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT + MODE_INSTRUCTIONS.get(mode, ""),
            },
            *openai_messages,
        ],
        "temperature": settings["temperature"],
        "max_completion_tokens": settings["max_tokens"],
        "stream": True,
        "extra_body": {"reasoning_effort": settings["reasoning"]},
    }
    if settings["json"]:
        kwargs["response_format"] = {"type": "json_object"}

    stream = await client.chat.completions.create(**kwargs)

    async for chunk in stream:
        if chunk.choices and chunk.choices[0].delta.content:
            yield chunk.choices[0].delta.content
