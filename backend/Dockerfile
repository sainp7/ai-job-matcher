FROM python:3.11-slim

# Prevent python from writing pyc files & enable real-time logs
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# System deps (keep minimal)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy ONLY what is required at runtime
COPY main.py /app/main.py
COPY prompts /app/prompts

# App port
EXPOSE 8000

# OPENAI_API_KEY will be injected at runtime
# docker run -e OPENAI_API_KEY=sk-... image

CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info"]

