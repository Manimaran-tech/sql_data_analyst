# Build stage: use official Python slim image
FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8002

# Set working directory
WORKDIR /app

# Install system build dependencies required for compiling wheels
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy python dependencies definitions
COPY pyproject.toml /app/

# Install the dependencies from pyproject.toml and other runtime requirements
# We install keyring, cryptography, pandas, uvicorn, and other packages explicitly to ensure compatibility
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
    "fastapi>=0.100.0" \
    "uvicorn[standard]>=0.22.0" \
    "pandas>=2.0.0" \
    "keyring>=24.0.0" \
    "cryptography>=41.0.0" \
    "asyncpg>=0.31.0" \
    "duckdb>=1.5.3" \
    "firebase-admin>=7.4.0" \
    "motor>=3.7.1" \
    "openpyxl>=3.1.5" \
    "pymongo>=4.17.0" \
    "sqlalchemy>=2.0.50" \
    "httpx>=0.24.0" \
    "openai>=1.0.0" \
    "matplotlib>=3.7.0" \
    "seaborn>=0.12.0" \
    "python-multipart>=0.0.6"

# Copy the rest of the application files
COPY . /app/

# Ensure the uploads directory exists and has correct permissions
RUN mkdir -p /app/backend/uploads && chmod 777 /app/backend/uploads

# Expose port
EXPOSE 8002

# Define a volume for persistent file uploads
VOLUME /app/backend/uploads

# Run the backend using uvicorn, binding to the PORT environment variable dynamically
CMD ["sh", "-c", "uvicorn backend.app:app --host 0.0.0.0 --port ${PORT}"]
