FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for PuLP CBC solver
RUN apt-get update && apt-get install -y \
    coinor-cbc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY main.py .
COPY server.py .
COPY exotic_class_items.py .

# Expose port
EXPOSE 8000

# Run the server
CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]