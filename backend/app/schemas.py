from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1)
    lesson_id: str | None = None
    lesson_title: str | None = None
    lesson_content: str | None = None
    schema: str | None = None
    task_prompt: str | None = None
    task_number: int | None = None
    task_total: int | None = None
    last_query: str | None = None
    last_result: str | None = None
    last_error: str | None = None