# ✅ TESTED WORKING BASE IMAGE. NO HASHES.
FROM python:3.11-slim

WORKDIR /app

# Install minimal system dependencies
RUN apt update && apt install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip wheel setuptools
RUN pip install --no-cache-dir -r requirements.txt

# Copy only required files. We do NOT copy notebooks, raw data, venv, frontend etc
COPY api ./api
COPY src ./src
COPY models ./models

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]