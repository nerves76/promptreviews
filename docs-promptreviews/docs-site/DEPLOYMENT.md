# Deployment Guide - Subdirectory Setup

This guide explains how to deploy the documentation site to a subdirectory (e.g., `yoursite.com/docs/`) alongside your WordPress site.

## 🚀 Quick Setup

### 1. Build for Production

```bash
cd docs-promptreviews/docs-site
npm run build:prod
```

This creates a production build in the `.next` folder with the `/docs` basePath.

### 2. Deploy Options

#### Option A: Static Export (Recommended)

```bash
# Add to next.config.js
const nextConfig = {
  output: 'export',
  basePath: '/docs',
  assetPrefix: '/docs',
  trailingSlash: true,
  // ... other config
}
```

Then build and copy the `out` folder to your web server.

#### Option B: Node.js Server

Deploy the `.next` folder and run:

```bash
npm run start
```

### 3. Web Server Configuration

#### Nginx Example

```nginx
server {
    listen 80;
    server_name yoursite.com;

    # WordPress (main site)
    location / {
        proxy_pass http://wordpress-server;
    }

    # Documentation site
    location /docs/ {
        proxy_pass http://localhost:3001/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache Example

```apache
<VirtualHost *:80>
    ServerName yoursite.com
    
    # WordPress
    DocumentRoot /path/to/wordpress
    
    # Docs subdirectory
    ProxyPass /docs/ http://localhost:3001/
    ProxyPassReverse /docs/ http://localhost:3001/
</VirtualHost>
```

### 4. WordPress Integration

Add this to your WordPress `.htaccess`:

```apache
# Route /docs/ to Next.js app
RewriteRule ^docs/(.*)$ http://localhost:3001/$1 [P,L]
```

## 🔧 Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
NEXT_PUBLIC_BASE_PATH=/docs
```

## 📁 File Structure After Deployment

```
yoursite.com/
├── wp-content/          # WordPress files
├── wp-admin/           # WordPress admin
├── docs/               # Documentation site
│   ├── _next/         # Next.js assets
│   ├── getting-started/
│   ├── prompt-pages/
│   └── index.html
└── index.php          # WordPress entry point
```

## 🔍 Testing

1. **Local Testing**: `npm run dev` (no basePath)
2. **Production Testing**: `npm run build:prod && npm run start`
3. **Access**: `http://yoursite.com/docs/`

## 🚨 Important Notes

- All internal links automatically work with basePath
- Static assets are served from `/docs/_next/`
- SEO metadata includes correct canonical URLs
- Search functionality works within the subdirectory

## 🆘 Troubleshooting

### Common Issues:

1. **404 Errors**: Check that basePath is correctly set
2. **Broken Assets**: Verify assetPrefix configuration
3. **Routing Issues**: Ensure trailingSlash is enabled
4. **WordPress Conflicts**: Check .htaccess rewrite rules

### Debug Commands:

```bash
# Check build output
ls -la .next/

# Test production build locally
npm run build:prod && npm run start

# Verify basePath in build
grep -r "basePath" .next/
```
