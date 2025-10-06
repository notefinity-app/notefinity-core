#!/bin/bash

# CapRover Deployment Script for Notefinity Core
# This script helps deploy the application to CapRover

set -e

echo "🚀 Notefinity Core - CapRover Deployment Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if caprover CLI is installed
if ! command -v caprover &> /dev/null; then
    print_error "CapRover CLI is not installed!"
    echo "Install it with: npm install -g caprover"
    exit 1
fi

print_success "CapRover CLI found"

# Check if we're in the right directory structure
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [ ! -f "${PROJECT_ROOT}/package.json" ] || [ ! -f "${SCRIPT_DIR}/captain-definition" ]; then
    print_error "Invalid project structure detected"
    echo "Expected: self-hosting/caprover/captain-definition and package.json in project root"
    exit 1
fi

# Change to project root for operations
cd "${PROJECT_ROOT}"

print_success "Project structure validated"

# Check if git is clean (optional warning)
if command -v git &> /dev/null && [ -d ".git" ]; then
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "You have uncommitted changes. Consider committing them first."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Run tests (optional)
echo
read -p "🧪 Run tests before deployment? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_status "Running tests..."
    if npm test; then
        print_success "Tests passed!"
    else
        print_error "Tests failed!"
        read -p "Continue with deployment anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
fi

# Build the project
echo
print_status "Building project..."
if npm run build; then
    print_success "Build completed successfully!"
else
    print_error "Build failed!"
    exit 1
fi

# Deploy with CapRover
echo
print_status "Starting CapRover deployment..."
echo

# Check if user is logged in to CapRover
if ! caprover list &> /dev/null; then
    print_warning "You need to login to CapRover first"
    echo "Running: caprover login"
    caprover login
fi

# Deploy
print_status "Deploying to CapRover..."
# Create temporary captain-definition in project root for deployment
cp "${SCRIPT_DIR}/captain-definition" ./captain-definition
if caprover deploy; then
    rm -f ./captain-definition
    print_success "🎉 Deployment completed successfully!"
    echo
    echo "Your Notefinity Core application should now be running on CapRover."
    echo
    echo "Next steps:"
    echo "1. Configure environment variables in CapRover dashboard"
    echo "2. Set up your CouchDB instance"
    echo "3. Configure custom domains and SSL if needed"
    echo "4. Test the health endpoint: https://your-app.your-domain.com/health"
    echo
    echo "📖 See CAPROVER_DEPLOYMENT.md for detailed configuration instructions"
else
    rm -f ./captain-definition
    print_error "Deployment failed!"
    echo
    echo "Troubleshooting tips:"
    echo "1. Check the build logs in CapRover dashboard"
    echo "2. Verify your captain-definition file is correct"
    echo "3. Ensure you have sufficient resources on your CapRover instance"
    echo "4. Check if the app name already exists"
    exit 1
fi