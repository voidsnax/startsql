from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=8000)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=20)
    mode: Literal["chat", "hint", "review", "quiz"] = "chat"
    lesson_id: str | None = Field(None, max_length=100)
    lesson_title: str | None = Field(None, max_length=200)
    lesson_content: str | None = Field(None, max_length=8000)
    schema: str | None = Field(None, max_length=4000)
    task_prompt: str | None = Field(None, max_length=2000)
    task_number: int | None = None
    task_total: int | None = None
    editor_query: str | None = Field(None, max_length=8000)
    editor_is_default: bool | None = None
    last_executed_query: str | None = Field(None, max_length=8000)
    last_result: str | None = Field(None, max_length=8000)
    last_error: str | None = Field(None, max_length=2000)