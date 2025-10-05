#!/bin/bash

# Notefinity Core - Project Status Check
echo "🔍 Notefinity Core - Project Status Check"
echo "========================================"

# Check Node.js version
echo "📦 Node.js Version:"
node --version
echo

# Check TypeScript build
echo "🔨 TypeScript Build Status:"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi
echo

# Check tests
echo "🧪 Test Status:"
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ All tests passing"
else
    echo "❌ Tests failing"
    exit 1
fi
echo

# Check code formatting
echo "🎨 Code Formatting:"
npm run format:check > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Code properly formatted"
else
    echo "⚠️  Code needs formatting (run: npm run format)"
fi
echo

# Check security
echo "🔒 Security Audit:"
npm audit --audit-level=moderate > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ No security vulnerabilities"
else
    echo "⚠️  Security issues found (run: npm audit)"
fi
echo

# Check file structure
echo "📁 Project Structure:"
if [ -f "README.md" ] && [ -f "DEVELOPMENT.md" ] && [ -f "CONTRIBUTING.md" ]; then
    echo "✅ Documentation complete"
else
    echo "❌ Missing documentation files"
fi

if [ -f "docker-compose.yml" ] && [ -f ".env.example" ]; then
    echo "✅ Development environment setup complete"
else
    echo "❌ Missing development environment files"
fi

if [ -d "src" ] && [ -d "tests" ] && [ -d "plugins" ]; then
    echo "✅ Source structure complete"
else
    echo "❌ Missing source directories"
fi
echo

# Project metrics
echo "📊 Project Metrics:"
echo "   Lines of TypeScript: $(find src -name "*.ts" -exec wc -l {} \; | awk '{sum+=$1} END {print sum}')"
echo "   Test files: $(find tests -name "*.test.ts" | wc -l | tr -d ' ')"
echo "   Plugin examples: $(find plugins -name "*.js" | wc -l | tr -d ' ')"
echo "   Dependencies: $(cat package.json | jq '.dependencies | length')"
echo

# API endpoints count
echo "🌐 API Endpoints:"
echo "   Auth routes: $(grep -r "router\." src/routes/auth.ts | wc -l | tr -d ' ')"  
echo "   Notes routes: $(grep -r "router\." src/routes/notes.ts | wc -l | tr -d ' ')"
echo "   Sync routes: $(grep -r "router\." src/routes/sync.ts | wc -l | tr -d ' ')"
echo

echo "🎉 Notefinity Core Status: Ready for development!"
echo "📚 Quick start: ./setup.sh && docker-compose up -d && npm start"