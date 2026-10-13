import os

from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY is not set in .env")

MODEL_NAME = "qwen/qwen3.8-27b"
BASE_URL = "https://api.groq.com/openai/v1"