# ============================================================================
# Backend Dockerfile — Python 3.12 + FastAPI + Celery
# ============================================================================
FROM python:3.12-slim AS base

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install LibreOffice for PDF conversion (document generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer-nogui \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install (separate layer for caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (only the app package, not tests/.git/etc)
COPY app/ ./app/

# Create non-root user
RUN useradd -m -u 1000 crm && chown -R crm:crm /app
USER crm

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
