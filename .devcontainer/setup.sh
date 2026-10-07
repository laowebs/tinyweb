#!/bin/bash
echo "Installing Surge globally..."
npm install -g surge

echo "Starting Ollama server..."
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS="*" ollama serve &
sleep 3

echo "Pulling Qwen 2.5 0.5B model..."
ollama pull qwen2.5:0.5b

echo "Starting Open WebUI container..."
docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main

echo "All environments set up successfully!"
