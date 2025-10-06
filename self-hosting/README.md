# Self-Hosting Notefinity Core

This directory contains deployment configurations and guides for self-hosting Notefinity Core on various platforms.

## Available Deployment Options

### 🚀 CapRover

**Recommended for beginners**

CapRover provides a simple, one-click deployment experience with a web-based dashboard for managing your applications.

- **Directory:** [`caprover/`](caprover/)
- **Documentation:** [CAPROVER_DEPLOYMENT.md](caprover/CAPROVER_DEPLOYMENT.md)
- **Quick Deploy:** `npm run deploy:caprover`

**Features:**

- One-click deployment
- Web-based dashboard
- Automatic SSL certificates
- Easy scaling
- Built-in load balancer

### 🐳 Docker

**For advanced users**

Direct Docker deployment for maximum control over your environment.

- **Dockerfile:** [`../Dockerfile`](../Dockerfile)
- **Quick Start:** `npm run docker:build && npm run docker:run`

## Prerequisites

All deployment methods require:

1. **CouchDB Instance** - For data storage
2. **Node.js Environment** - Runtime for the application
3. **Environment Configuration** - See [`.env.example`](../.env.example)

## Choosing a Deployment Method

| Method   | Difficulty | Best For                               |
| -------- | ---------- | -------------------------------------- |
| CapRover | Easy       | Beginners, small to medium deployments |
| Docker   | Medium     | Advanced users, custom setups          |

## Getting Started

1. **Choose your deployment method** from the options above
2. **Set up your CouchDB instance** (can be self-hosted or cloud-based)
3. **Configure environment variables** (copy from `.env.example`)
4. **Follow the specific deployment guide** for your chosen method

## Support

- **General Issues:** Check the main [README.md](../README.md)
- **Deployment-specific Issues:** See the documentation in each deployment directory
- **Community:** Create an issue in the repository

## Contributing

Have experience with other deployment platforms? We welcome contributions for:

- Kubernetes manifests
- Docker Compose configurations
- Cloud platform deployment guides (AWS, GCP, Azure)
- CI/CD pipeline examples

See [CONTRIBUTING.md](../CONTRIBUTING.md) for contribution guidelines.
