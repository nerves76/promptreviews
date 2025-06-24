# Staging Environment Setup Guide

This guide explains how to set up and use staging environments for PromptReviews.

## 🎯 **Current Setup**

### ✅ **What's Already Configured:**
- **Production Environment**: `https://promptreviews-nerves76s-projects.vercel.app`
- **Staging Branch**: `staging` branch created and pushed to GitHub
- **Environment Variables**: All configured for Production, Preview, and Development
- **Google Analytics**: Tracking ID `G-22JHGCL1T7` added to Production environment

### 📊 **Environment Variables Status:**
```
✅ NEXT_PUBLIC_GA_TRACKING_ID - Production
✅ SENTRY_PROJECT - Production, Preview, Development  
✅ SENTRY_ORG - Production, Preview, Development
✅ NEXT_PUBLIC_SENTRY_RELEASE - Production, Preview, Development
✅ NEXT_PUBLIC_SENTRY_DSN - Production, Preview, Development
✅ SUPABASE_SERVICE_ROLE_KEY - Production, Preview, Development
✅ RESEND_API_KEY - Development, Preview, Production
✅ STRIPE_SECRET_KEY - Development, Preview, Production
✅ STRIPE_PRICE_ID_GROWER - Development, Preview, Production
✅ STRIPE_PRICE_ID_BUILDER - Development, Preview, Production
✅ STRIPE_PRICE_ID_MAVEN - Development, Preview, Production
✅ NEXT_PUBLIC_APP_URL - Production, Preview, Development
✅ NEXT_PUBLIC_SUPABASE_URL - Production, Preview, Development
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY - Production, Preview, Development
✅ OPENAI_API_KEY - Production, Preview, Development
```

## 🚀 **How Staging Works**

### **Branch-Based Deployment Strategy:**

1. **Main Branch** → **Production Environment**
   - URL: `https://promptreviews-nerves76s-projects.vercel.app`
   - Automatic deployment on push to `main`
   - Uses Production environment variables

2. **Staging Branch** → **Preview Environment**
   - URL: `https://promptreviews-git-staging-nerves76s-projects.vercel.app`
   - Automatic deployment on push to `staging`
   - Uses Preview environment variables

3. **Pull Requests** → **Preview Environment**
   - URL: `https://promptreviews-git-[branch]-nerves76s-projects.vercel.app`
   - Automatic deployment for each PR
   - Uses Preview environment variables

## 🔧 **Setting Up Staging Environment**

### **Step 1: Add Google Analytics to Preview Environment**

Run this command to add GA tracking to staging/preview environments:

```bash
vercel env add NEXT_PUBLIC_GA_TRACKING_ID preview
# When prompted, enter: G-22JHGCL1T7
# When asked for Git branch, press Enter (for all preview branches)
```

### **Step 2: Deploy Staging Environment**

```bash
# Switch to staging branch
git checkout staging

# Make any staging-specific changes
# (e.g., different API endpoints, feature flags, etc.)

# Push to trigger staging deployment
git push origin staging
```

### **Step 3: Verify Staging Deployment**

1. Check Vercel dashboard for staging deployment
2. Visit the staging URL to test functionality
3. Verify Google Analytics is tracking on staging

## 📋 **Workflow for New Features**

### **Development Workflow:**

```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/new-feature

# 2. Develop and test locally
npm run dev

# 3. Push to staging for testing
git checkout staging
git merge feature/new-feature
git push origin staging

# 4. Test on staging environment
# Visit: https://promptreviews-git-staging-nerves76s-projects.vercel.app

# 5. If tests pass, merge to main for production
git checkout main
git merge feature/new-feature
git push origin main
```

### **Hotfix Workflow:**

```bash
# 1. Create hotfix branch
git checkout main
git checkout -b hotfix/critical-fix

# 2. Make urgent fixes
# 3. Test locally
npm run dev

# 4. Deploy directly to production (bypass staging for urgent fixes)
git checkout main
git merge hotfix/critical-fix
git push origin main
```

## 🌐 **Environment URLs**

### **Production:**
- **URL**: `https://promptreviews-nerves76s-projects.vercel.app`
- **Branch**: `main`
- **Environment**: Production
- **Analytics**: Full tracking enabled

### **Staging:**
- **URL**: `https://promptreviews-git-staging-nerves76s-projects.vercel.app`
- **Branch**: `staging`
- **Environment**: Preview
- **Analytics**: Full tracking enabled

### **Feature Branches:**
- **URL**: `https://promptreviews-git-[branch-name]-nerves76s-projects.vercel.app`
- **Branch**: Any feature branch
- **Environment**: Preview
- **Analytics**: Full tracking enabled

## 🔍 **Testing Staging Environment**

### **1. Functional Testing:**
- Test all user flows
- Verify widget functionality
- Check admin panel features
- Test payment integration

### **2. Analytics Testing:**
- Visit `/test-ga` on staging
- Trigger test events
- Verify events appear in GA4 dashboard
- Check Sentry error tracking

### **3. Performance Testing:**
- Test page load times
- Verify API response times
- Check for any build errors

## 🛠 **Environment-Specific Configuration**

### **Staging-Specific Features:**
- Enhanced error logging
- Debug mode enabled
- Test data available
- Slower rate limits for testing

### **Production Features:**
- Optimized performance
- Production rate limits
- Minimal logging
- Full security measures

## 📊 **Monitoring & Analytics**

### **Google Analytics:**
- **Production**: Full user tracking
- **Staging**: Full tracking (for testing)
- **Events**: All user interactions tracked

### **Sentry Error Tracking:**
- **Production**: Error monitoring
- **Staging**: Enhanced error logging
- **Environment**: Automatically tagged

### **Vercel Analytics:**
- **Production**: Performance monitoring
- **Staging**: Build and deployment metrics
- **Real-time**: Deployment status

## 🔐 **Security Considerations**

### **Environment Variables:**
- All sensitive data encrypted
- Different keys for different environments
- No secrets in code repository

### **Access Control:**
- Production: Restricted access
- Staging: Team access for testing
- Development: Local only

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Staging deployment fails:**
   ```bash
   # Check build logs
   vercel logs [deployment-url]
   
   # Check environment variables
   vercel env ls
   ```

2. **Analytics not working on staging:**
   - Verify `NEXT_PUBLIC_GA_TRACKING_ID` is set for Preview environment
   - Check browser console for errors
   - Visit `/test-ga` to test tracking

3. **Environment variables missing:**
   ```bash
   # Add missing variable
   vercel env add [VARIABLE_NAME] preview
   ```

### **Useful Commands:**

```bash
# List all deployments
vercel ls

# Check environment variables
vercel env ls

# View deployment logs
vercel logs [url]

# Redeploy staging
git push origin staging

# Promote staging to production
vercel promote [staging-url]
```

## 📝 **Best Practices**

1. **Always test on staging before production**
2. **Use feature flags for gradual rollouts**
3. **Monitor analytics on both environments**
4. **Keep staging environment clean**
5. **Document any environment-specific configurations**

---

**Last Updated**: January 2025
**Next Review**: After major feature releases 