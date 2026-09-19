# Siri Sofa Services — Production Dockerfile
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

# Set working directory
WORKDIR /app

# Install dependencies (if any added to requirements.txt)
COPY requirements.txt ./
RUN if [ -s requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Copy application files
COPY . .

# Ensure data directory exists with write permissions for SQLite
RUN mkdir -p /app/data

# Expose server port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD python3 -c "import os, urllib.request; p = os.environ.get('PORT', 8000); urllib.request.urlopen(f'http://127.0.0.1:{p}/api/services')" || exit 1

# Start the application
CMD ["python3", "run.py"]
