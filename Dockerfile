# ============================================================================
# Device Service Management System - Multi-stage Docker Build
# ============================================================================

# ============================================================================
# Stage 1: Backend Build Stage
# ============================================================================
FROM python:3.11-slim as backend-builder

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ============================================================================
# Stage 2: Frontend Build Stage
# ============================================================================
FROM node:18-alpine as frontend-builder

# Set work directory
WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY frontend/ .

# Build the application
RUN npm run build

# ============================================================================
# Stage 3: Production Stage
# ============================================================================
FROM python:3.11-slim

# Install Node.js for serving frontend (optional)
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && mkdir -p /app \
    && chown -R app:app /app

# Set work directory
WORKDIR /app

# Copy Python dependencies from backend builder
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Copy built frontend assets
COPY --from=frontend-builder /app/dist ./frontend/dist

# Create logs directory
RUN mkdir -p logs && chown -R app:app logs

# Switch to non-root user
USER app

# Set environment variables
ENV PYTHONPATH=/app \
    PYTHONUNBUFFERED=1 \
    DEVICE_SERVICE_HOST=0.0.0.0 \
    DEVICE_SERVICE_PORT=8000 \
    DATABASE_URL=sqlite:///./device_service.db

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Expose ports
EXPOSE 8000

# Default command
CMD ["python", "-m", "app.main"]