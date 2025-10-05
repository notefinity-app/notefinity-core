#!/bin/bash

# Notefinity Core Setup Script
echo "🚀 Setting up Notefinity Core..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating environment file..."
    cp .env.example .env
    echo "⚠️  Please edit .env file to configure your settings"
else
    echo "✅ Environment file already exists"
fi

# Check if Docker is available for CouchDB
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo ""
    echo "🐳 Docker is available. You can start CouchDB with:"
    echo "   docker-compose up -d"
    echo ""
elif command -v docker &> /dev/null; then
    echo ""
    echo "🐳 Docker is available. You can start CouchDB with:"
    echo "   docker run -d --name couchdb -p 5984:5984 \\"
    echo "     -e COUCHDB_USER=admin \\"
    echo "     -e COUCHDB_PASSWORD=password \\"
    echo "     couchdb:latest"
    echo ""
else
    echo ""
    echo "⚠️  Docker not found. Please install CouchDB manually:"
    echo "   - macOS: brew install couchdb && brew services start couchdb"
    echo "   - Ubuntu: sudo apt-get install couchdb"
    echo "   - Or use Docker (recommended)"
    echo ""
fi

# Build the project
echo "🔨 Building project..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. Edit .env file with your configuration"
    echo "2. Start CouchDB (see instructions above)"
    echo "3. Run 'npm start' to start the server"
    echo ""
    echo "Development commands:"
    echo "- npm run dev     : Build and start server"
    echo "- npm test        : Run tests"
    echo "- npm run format  : Format code"
    echo ""
    echo "API will be available at: http://localhost:3001"
    echo "Health check: http://localhost:3001/health"
    echo ""
else
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi