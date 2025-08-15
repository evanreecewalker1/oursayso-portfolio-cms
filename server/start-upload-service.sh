#!/bin/bash

# Start the automated large video upload service
# This needs to run in the background to handle large video uploads

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
cd "$SCRIPT_DIR"

echo "🎬 Starting Large Video Upload Service..."
echo "📁 Working directory: $SCRIPT_DIR"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🚀 Starting upload service on http://localhost:3001"
echo "💡 Keep this terminal open - the service needs to run in background"
echo "❌ Close this terminal to stop the service"
echo ""
echo "✅ CMS will now automatically upload large videos (>25MB) via Git LFS!"
echo ""

# Start the service
node upload-service.js