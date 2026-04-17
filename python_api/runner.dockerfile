FROM python:3.11-slim

# Headless backend for matplotlib inside containers.
ENV MPLBACKEND=Agg
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir numpy matplotlib

USER 65534:65534
WORKDIR /sandbox
