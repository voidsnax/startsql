import json
import logging

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from ..limiter import limiter
from ..llm import stream_chat
from ..schemas import ChatRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["chat"])


def _friendly_error(e: Exception) -> str:
    msg = str(e)
    if "503" in msg or "UNAVAILABLE" in msg:
        return "The assistant is busy right now — please try again in a moment."
    if "429" in msg or "quota" in msg.lower() or "rate" in msg.lower():
        return "Hit the free-tier rate limit. Wait a minute and try again."
    if "400" in msg or "INVALID_ARGUMENT" in msg:
        return "Something in the request looked off. Try rephrasing your question."
    return "Something went wrong on the assistant's side. Please try again."


@router.post("/chat")
@limiter.limit("10/minute")
async def chat(request: Request, chat_request: ChatRequest):
    if not chat_request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    messages = [m.model_dump() for m in chat_request.messages]
    mode = chat_request.mode

    task_prompt = chat_request.task_prompt
    task_number = chat_request.task_number
    task_total = chat_request.task_total
    editor_query = chat_request.editor_query
    editor_is_default = chat_request.editor_is_default
    last_executed_query = chat_request.last_executed_query
    last_result = chat_request.last_result
    last_error = chat_request.last_error

    # A quiz tests the lesson, not whatever happens to be in the editor.
    if mode == "quiz":
        task_prompt = task_number = task_total = None
        editor_query = editor_is_default = None
        last_executed_query = last_result = last_error = None

    async def event_stream():
        try:
            async for chunk in stream_chat(
                messages=messages,
                mode=mode,
                lesson_title=chat_request.lesson_title,
                lesson_content=chat_request.lesson_content,
                schema=chat_request.schema,
                task_prompt=task_prompt,
                task_number=task_number,
                task_total=task_total,
                editor_query=editor_query,
                editor_is_default=editor_is_default,
                last_executed_query=last_executed_query,
                last_result=last_result,
                last_error=last_error,
            ):
                payload = json.dumps({"type": "token", "content": chunk})
                yield f"data: {payload}\n\n"
        except Exception as e:  
            logger.exception("[chat] mode=%s failed", mode)
            payload = json.dumps({"type": "error", "content": _friendly_error(e)})
            yield f"data: {payload}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )