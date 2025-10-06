# CapRover Deployment Guide

This guide explains how to deploy the Notefinity Core application to CapRover.

## Prerequisites

1. **CapRover Server**: Ensure you have a CapRover server running
2. **CapRover CLI**: Install the CapRover CLI tool
   ```bash
   npm install -g caprover
   ```
3. **Git Repository**: Your code should be in a Git repository

## Deployment Files

The following files have been added for CapRover deployment:

- `captain-definition`: CapRover configuration file
- `Dockerfile`: Docker container configuration
- `.dockerignore`: Files to exclude from Docker build

## Environment Variables

Configure these environment variables in your CapRover app:

### Required Variables

```bash
# Database Configuration
COUCHDB_URL=http://your-couchdb-instance:5984
COUCHDB_USERNAME=your-username
COUCHDB_PASSWORD=your-password

# Authentication
JWT_SECRET=your-jwt-secret-key-minimum-32-characters

# Server Configuration
PORT=3000
NODE_ENV=production
```

### Optional Variables

```bash
# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

## Deployment Steps

### Method 1: Direct Deploy (Recommended)

1. **Login to CapRover**:

   ```bash
   caprover login
   ```

2. **Deploy from current directory**:
   ```bash
   caprover deploy
   ```

### Method 2: Git Repository Deploy

1. **Create app in CapRover dashboard**:

   - Go to your CapRover dashboard
   - Create a new app (e.g., `notefinity-core`)
   - Configure environment variables

2. **Set up Git deployment**:

   - In the app settings, go to "Deployment" tab
   - Choose "Deploy from Github/Bitbucket/Gitlab"
   - Configure repository URL and branch

3. **Enable automatic deployments** (optional):
   - Set up webhooks for automatic deployment on push

### Method 3: Captain Definition Upload

1. **Create app in CapRover dashboard**
2. **Upload tarball**:
   ```bash
   # Create deployment tarball
   tar -czf notefinity-core.tar.gz \
     captain-definition \
     Dockerfile \
     package.json \
     package-lock.json \
     tsconfig.json \
     vite.config.ts \
     src/
   ```
3. **Upload via CapRover dashboard**

## Configuration

### App Configuration

1. **Port Mapping**: CapRover will automatically handle port mapping
2. **HTTP Settings**:
   - Enable HTTPS if you have SSL configured
   - Configure custom domains if needed

### Database Setup

You'll need a CouchDB instance. You can either:

1. **Deploy CouchDB on CapRover**:

   - Use the one-click app from CapRover marketplace
   - Or deploy using the official CouchDB Docker image

2. **Use external CouchDB service**:
   - Configure the `COUCHDB_URL` to point to your external instance

### Health Check

The app includes a health check endpoint at `/health`. CapRover will automatically use this for health monitoring.

## Troubleshooting

### Common Issues

1. **Build Failures**:

   - Check build logs in CapRover dashboard
   - Ensure all dependencies are properly listed in package.json

2. **Container Won't Start**:

   - Check environment variables are set correctly
   - Verify database connectivity
   - Check application logs

3. **Database Connection Issues**:
   - Verify COUCHDB_URL is accessible from the container
   - Check database credentials
   - Ensure database exists

### Logs

View application logs in the CapRover dashboard:

- Go to your app
- Click on "App Logs" tab
- Monitor real-time logs and errors

## Security Considerations

1. **Environment Variables**: Never commit sensitive environment variables to your repository
2. **JWT Secret**: Use a strong, unique JWT secret (minimum 32 characters)
3. **Database Security**: Ensure your CouchDB instance is properly secured
4. **HTTPS**: Always use HTTPS in production
5. **CORS**: Configure ALLOWED_ORIGINS to only include your frontend domains

## Scaling

CapRover supports horizontal scaling:

1. Go to your app in the CapRover dashboard
2. Increase the "Instance Count"
3. CapRover will automatically load balance between instances

## Updates

To update your deployment:

1. **Code Changes**: Push to your repository (if using Git deploy) or run `caprover deploy`
2. **Environment Variables**: Update in CapRover dashboard
3. **Rollback**: Use CapRover's built-in rollback feature if needed

## Monitoring

Monitor your application using:

1. **CapRover Dashboard**: Built-in monitoring and logs
2. **Health Endpoint**: `/health` endpoint for external monitoring
3. **Application Metrics**: The app logs important metrics and errors

## Support

For CapRover-specific issues:

- [CapRover Documentation](https://caprover.com/docs/)
- [CapRover GitHub](https://github.com/caprover/caprover)

For Notefinity Core issues:

- Check the main README.md
- Review application logs
