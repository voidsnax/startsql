import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from ..llm import stream_chat
from ..schemas import ChatRequest

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
async def chat(request: ChatRequest):
    if not request.messages:
        raise HTTPException(status_code=400, detail="No messages provided")

    messages = [m.model_dump() for m in request.messages]

    async def event_stream():
        try:
            async for chunk in stream_chat(
                messages=messages,
                lesson_title=request.lesson_title,
                lesson_content=request.lesson_content,
                schema=request.schema,
                task_prompt=request.task_prompt,
                task_number=request.task_number,
                task_total=request.task_total,
                editor_query=request.editor_query,
                editor_is_default=request.editor_is_default,
                last_executed_query=request.last_executed_query,
                last_result=request.last_result,
                last_error=request.last_error,
            ):
                payload = json.dumps({"type": "token", "content": chunk})
                yield f"data: {payload}\n\n"
        except Exception as e:  # noqa: BLE001
            print(f"[chat] error: {e}")
            payload = json.dumps({"type": "error", "content": _friendly_error(e)})
            yield f"data: {payload}\n\n"
        finally:
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )