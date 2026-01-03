# Web Deployment Guide

This guide explains how to build and deploy the KraftLog web application as a standalone static site without Expo.

## Prerequisites

- Node.js and npm installed
- Backend API server running and accessible

## Configuration

The web version requires the `EXPO_PUBLIC_API_URL` environment variable to be set. This should point to your backend API server.

### Development
Create or update `.env` file:
```bash
EXPO_PUBLIC_API_URL=http://localhost:8080/api
```

### Production
For production builds, set the environment variable before building:
```bash
export EXPO_PUBLIC_API_URL=https://your-api-server.com/api
npm run web:export
```

Or create a `.env.production` file:
```bash
EXPO_PUBLIC_API_URL=https://your-api-server.com/api
```

## Building for Production

### 1. Export the Web App
```bash
npm run web:export
```

This will:
- Build the app for production
- Generate static files in the `dist/` directory
- Optimize assets and bundle JavaScript

### 2. Test Locally
```bash
npm run web:serve
```

Then open http://localhost:3000 in your browser.

## Deployment Options

### Option 1: Static Hosting (Netlify, Vercel, etc.)

**Netlify:**
1. Install Netlify CLI: `npm install -g netlify-cli`
2. Build: `npm run web:export`
3. Deploy: `netlify deploy --dir=dist --prod`

**Vercel:**
1. Install Vercel CLI: `npm install -g vercel`
2. Build: `npm run web:export`
3. Deploy: `vercel --prod`

**Environment Variables:**
Make sure to set `EXPO_PUBLIC_API_URL` in your hosting platform's settings.

### Option 2: Docker Container

Create a `Dockerfile.web`:
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
ARG EXPO_PUBLIC_API_URL
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL
RUN npm run web:export

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:
```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Build and run:
```bash
docker build --build-arg EXPO_PUBLIC_API_URL=https://your-api.com/api -f Dockerfile.web -t kraftlog-web .
docker run -p 8080:80 kraftlog-web
```

### Option 3: Traditional Web Server (Apache, Nginx)

1. Build the app: `npm run web:export`
2. Copy contents of `dist/` to your web server's document root
3. Configure server for SPA routing:

**Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/kraftlog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache (.htaccess):**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## Important Notes

### CORS Configuration
Your backend API must allow requests from your web app's domain. Add CORS headers:
```
Access-Control-Allow-Origin: https://your-web-app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

### Environment Variables
- The `EXPO_PUBLIC_API_URL` is embedded during build time
- To change the API URL, you must rebuild and redeploy
- For dynamic configuration, consider using a config endpoint

### Offline Mode
The web version does NOT support offline mode. Users must have an active connection to the backend API server.

## Troubleshooting

### Build Fails
- Ensure all dependencies are installed: `npm ci`
- Clear cache: `rm -rf node_modules/.cache`
- Check for TypeScript errors: `npx tsc --noEmit`

### API Connection Issues
- Verify `EXPO_PUBLIC_API_URL` is set correctly
- Check CORS configuration on backend
- Inspect network tab in browser DevTools
- Ensure backend API is accessible from web app domain

### Blank Page After Deployment
- Check browser console for errors
- Verify all assets are served correctly
- Ensure server is configured for SPA routing
- Check that base path matches deployment path

## Scripts Reference

- `npm run web` - Start development server with Expo
- `npm run web:export` - Build static files for production
- `npm run web:serve` - Serve built files locally for testing

## Updating .env

After changing `.env`, you must:
1. Stop the development server
2. Restart: `npm run web` or rebuild: `npm run web:export`
