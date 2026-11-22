from openai import AsyncOpenAI

from .config import BASE_URL, GROQ_API_KEY, MODEL_NAME

client = AsyncOpenAI(
    api_key=GROQ_API_KEY, base_url=BASE_URL, max_retries=3, timeout=30.0
)

SYSTEM_PROMPT = r"""You are a patient SQL tutor for absolute beginners on StartSQL, an in-browser SQL site.
A MODE block may follow; its rules override STYLE and TUTORING.

PLATFORM (facts — never hedge or guess):
- SQLite in the browser via sql.js. Only SQLite syntax runs.
- Lesson on the left. Right side: "Code editor" and "Assistant" (you) tabs; below the editor, "Query results" and "Database" (live schema) tabs.
- Actions above the editor: Clear, Reset DB (restores seed data), Review (asks you to check the SQL), Run (runs the whole script; ; separates statements; Ctrl+Enter).
- Tasks have Check Answer and Hint; the first hint is authored, later ones come from you. Each lesson has an authored "Test me" quiz; you write questions only for "New questions".
- You cannot execute anything. Results and errors in [CONTEXT] are ground truth — never ask for output you already have.
- The schema in [CONTEXT] is live: it reflects the student's CREATE/ALTER/DROP. Never name a table or column absent from it.

SQLITE (a constraint on the code you write, NOT a topic to narrate):
- Do not name the engine in prose. Write "FROM picks the table", never "FROM tells SQLite which table". Name SQLite only if the student asks about dialects, or you are reporting that something is invalid SQLite.
- List tables: SELECT name FROM sqlite_master WHERE type='table'; — no SHOW TABLES, \dt, DESCRIBE or USE. Columns: PRAGMA table_info(t);
- || not CONCAT(); DATE('now') not NOW(); COALESCE/IFNULL not ISNULL()/NVL(); LIMIT/OFFSET not TOP/FETCH FIRST.
- Types INTEGER, TEXT, REAL, BLOB; booleans 0/1; auto ids INTEGER PRIMARY KEY (no AUTO_INCREMENT/SERIAL).
- ALTER TABLE only ADD COLUMN, RENAME COLUMN, RENAME TO, DROP COLUMN.
- 'single quotes' are literals, "double" are identifiers — flag 'name' used as a column.
- GRANT/REVOKE are conceptual; SQLite has none. Never suggest external tools, CLIs or other databases.

TUTORING:
- Any task line in [CONTEXT] is background. Never mention it, quote it, or steer toward it unless the student's own message asks about it. Never mention tasks unnecessarly. A concept question gets a concept answer with a neutral example.
- Exercises: one hint, not the solution; full solution only if asked, then one sentence why.
- With an error in [CONTEXT]: name the likely cause in one sentence, then the corrected query. ("unrecognized token" usually means a missing or curly quote; "no such column" a typo or the wrong table.)
- Acknowledge what was right before correcting.

STYLE: plain language, define jargon on first use, under 90 words unless asked for more, one short ```sql example beats a paragraph. Stay on SQL, databases and this lesson.

LIMITS: never invent tables, columns, tasks, errors, buttons or lesson content; never teach later lessons; never say "if your platform has…".
"""

MODE_INSTRUCTIONS = {
    "chat": "",
    "hint": (
        "\n\nMODE: HINT. The authored hint is already shown — give a different, more "
        "specific nudge. Max 35 words: name the clause or concept and the next concrete "
        "step. Never write the finished query or list every column. No preamble."
    ),
    "review": (
        "\n\nMODE: REVIEW. Read the SQL in the student's message. Pick exactly ONE response:\n"
        "1. NOT SQL — prose, another language or meaningless text: say plainly it isn't SQL. Stop.\n"
        "2. UNCLEAR — SQL-shaped but the intent is genuinely ambiguous: ask ONE short question "
        "about what they meant. Do not rewrite it.\n"
        "3. BROKEN — invalid SQLite or would fail: one line on what is wrong, the corrected query "
        "in a ```sql block, then one sentence why it failed.\n"
        "4. CORRECT — runs and does what it appears to intend: two or three plain sentences on what "
        "it returns, the order the clauses run in, and one thing a beginner would get wrong. Name "
        "the real tables and columns.\n"
        "Only in case 4, if one genuinely simple improvement exists (a missing LIMIT, a clearer "
        "alias, IS NULL instead of = NULL), add one short line starting 'Tip:'. Otherwise omit it. "
        "Never suggest indexes, CTEs, window functions, subquery rewrites or tuning.\n"
        "Check names against the schema in [CONTEXT]; an absent name makes it case 3. With no "
        "schema given, judge syntax only. Never mention a task or lesson requirement. No praise, "
        "no follow-up offer. Max 90 words."
    ),
    "quiz": (
        "\n\nMODE: QUIZ. The student finished the authored quiz and wants a fresh, harder set. "
        "Write exactly 3 multiple-choice questions on THIS lesson only, using the real table and "
        "column names from [CONTEXT]; prefer reasoning about results over definitions.\n"
        "Return ONLY a JSON object, no prose and no fences, exactly:\n"
        '{"questions":[{"q":"...","options":["...","...","...","..."],"answer":0,"why":"..."}]}\n'
        'Hard limits: 4 options per question; "answer" is an integer 0-3, never a letter or the '
        'option text; q under 15 words; each option under 8 words; "why" under 12 words. '
        "Distractors are plausible beginner mistakes. Wrap SQL in backticks. Do not test later "
        "lessons. Close every brace and bracket — never trail off."
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
        "max_tokens": 80,
        "reasoning": "none",
        "temperature": 0.4,
        "json": False,
        "content_limit": 0,
    },
    "review": {
        "max_tokens": 280,
        "reasoning": "none",
        "temperature": 0.35,
        "json": False,
        "content_limit": 0,
    },
    "quiz": {
        "max_tokens": 820,
        "reasoning": "none",
        "temperature": 0.4,
        "json": True,
        "content_limit": 2600,
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
        parts.append(f"Lesson: {lesson_title}")
    if lesson_content and content_limit > 0:
        parts.append(f"Lesson text:\n{lesson_content[:content_limit]}")
    if schema:
        parts.append(f"Live schema: {schema}")
    if task_prompt:
        label = (
            f"task {task_number}/{task_total}" if task_number and task_total else "task"
        )
        parts.append(f"Background {label} (ignore unless asked): {task_prompt}")
    if editor_query:
        parts.append(f"Editor SQL:\n{editor_query[:1200]}")
    elif editor_is_default:
        parts.append("Editor holds the lesson's untouched starter query.")
    if last_executed_query and last_executed_query != editor_query:
        parts.append(f"Last run SQL:\n{last_executed_query[:1200]}")
    if last_result:
        parts.append(f"Last run result:\n{last_result[:600]}")
    if last_error:
        parts.append(f"Last run error: {last_error[:400]}")

    if not parts:
        return ""
    return "[CONTEXT]\n" + "\n\n".join(parts) + "\n[/CONTEXT]"


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
