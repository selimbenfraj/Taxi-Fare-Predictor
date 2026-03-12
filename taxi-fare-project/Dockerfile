# ═══════════════════════════════════════════════════════════════
#  FARECAST · Unified Dockerfile
#  Place at: taxi-fare-project/Dockerfile
#
#  Stages:
#    1. node-builder   → compiles React/Vite → dist/
#    2. py-builder     → installs Python deps
#    3. runner         → FastAPI serves API + React static files
#
#  Result: ONE container, ONE port (8000)
#  Nginx is NOT needed — FastAPI serves the built frontend too.
# ═══════════════════════════════════════════════════════════════


# ── Stage 1: Build React frontend ───────────────────────────────
FROM node:20-alpine AS node-builder

WORKDIR /frontend

# Cache-friendly: install deps before copying source
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

# Copy all frontend source
COPY frontend/ ./

# Vite production build → /frontend/dist
RUN npm run build


# ── Stage 2: Install Python dependencies ────────────────────────
FROM python:3.11-slim AS py-builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt


# ── Stage 3: Final runtime image ────────────────────────────────
FROM python:3.11-slim AS runner

# LightGBM needs libgomp1 at runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Python packages from py-builder
COPY --from=py-builder /install /usr/local

# API source
COPY api/ ./api/

# Trained model artifacts
COPY models/ ./models/

# React build output → served as static files by FastAPI
COPY --from=node-builder /frontend/dist ./static/

# Make api a proper Python package
RUN touch api/__init__.py

# Non-root user
RUN addgroup --system farecast \
    && adduser  --system --ingroup farecast farecast
USER farecast

EXPOSE 8000

# Uvicorn: 2 workers, binds to 0.0.0.0 so Docker can reach it
CMD ["uvicorn", "api.main:app", \
     "--host", "0.0.0.0", \
     "--port", "8000", \
     "--workers", "2"]