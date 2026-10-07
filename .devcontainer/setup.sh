#!/bin/bash
echo "Installing Surge globally..."
npm install -g surge

echo "Starting Ollama server..."
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS="*" ollama serve &
sleep 3

echo "Checking if Open WebUI container exists..."
if [ ! "$(docker ps -a -q -f name=open-webui)" ]; then
    echo "Creating and starting Open WebUI container..."
    docker run -d -p 3000:8080 --add-host=host.docker.internal:host-gateway -v open-webui:/app/backend/data --name open-webui --restart always ghcr.io/open-webui/open-webui:main
else
    echo "Starting existing Open WebUI container..."
    docker start open-webui
fi

echo "Environment setup complete!"
