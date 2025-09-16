# PromptReviews - Developer Quick Start

## 🚀 Get Started in 30 Seconds

1. **Clone and install:**
   ```bash
   git clone [repo]
   npm install
   npm run dev
   ```

2. **Quick login (skip auth setup):**
   ```javascript
   // In browser console:
   localStorage.setItem("dev_auth_bypass", "true");
   window.location.reload();
   ```

3. **Access:** http://localhost:3002

## 🔧 Development Authentication Bypass

### Enable Development Mode
```bash
# Option 1: Browser console
localStorage.setItem("dev_auth_bypass", "true");
window.location.reload();

# Option 2: Run script
node enable-dev-login.js
```

### What You Get
- ✅ **Full dashboard access** without sign-in
- ✅ **Business creation/management** 
- ✅ **Prompt page access**
- ✅ **Complete feature testing**
- ✅ **Zero authentication setup needed**

### Mock Account Details
- **Email:** test@example.com
- **User ID:** 12345678-1234-5678-9abc-123456789012
- **Account ID:** 12345678-1234-5678-9abc-123456789012

### Disable Development Mode
```javascript
localStorage.removeItem("dev_auth_bypass");
window.location.reload();
```

## 📁 Key Directories

```
src/
├── app/
│   ├── components/           # Reusable components
│   │   ├── prompt-features/  # Shared prompt page features
│   │   └── sections/         # Form sections
│   ├── dashboard/            # Dashboard pages
│   └── api/                  # API endpoints (RLS bypass)
├── contexts/                 # React contexts (auth, etc.)
├── utils/                    # Utility functions
└── hooks/                    # Custom React hooks
```

## 🏗️ Architecture Notes

### Prompt Page Forms
- **Individual pages:** Service, Event, Product, Photo (standardized)
- **Universal page:** Currently uses different architecture (needs refactoring)
- **Router:** `PromptPageForm.tsx` routes to specific form types

### Development RLS Bypass
- **Frontend:** Mock auth in contexts and guards
- **Backend:** Service role API endpoints bypass Row Level Security
- **API Routes:** `/api/businesses`, `/api/onboarding-tasks`

## 🐛 Common Development Issues

### Authentication Problems
- **Problem:** Redirected to sign-in page
- **Solution:** Enable dev_auth_bypass and refresh

### Business Profile Issues  
- **Problem:** "Complete business profile first" message
- **Solution:** Check dev_auth_bypass is enabled, business data loads via API

### Database Access Issues
- **Problem:** RLS policy violations
- **Solution:** Development mode routes through API endpoints with service role

### Stripe Checkout (Local, No Webhooks)
- **Problem:** After successful payment, pricing modal reappears because Stripe webhooks aren’t running locally
- **Solution:** Success URLs now include `session_id` and the app calls `/api/finalize-checkout` to update the account immediately (plan, billing period, customer/subscription IDs)

## 📚 Documentation

- **Full README:** `README.md` - Complete documentation
- **Project Overview:** `promptreviews.md` - Project history and features
- **Universal Page Plan:** `docs/UNIVERSAL_PROMPT_PAGE_STANDARDIZATION_PLAN.md`
- **Prompt Page Refactoring:** `PROMPT_PAGE_REFACTORING_README.md`

## 🔑 Environment Setup

Required for full functionality:
```bash
# Core (required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Optional for development
DISABLE_SENTRY=true
```

## 🚨 Important Notes

- **Development only:** All bypass code is `NODE_ENV === 'development'` gated
- **Production safe:** Zero impact on production environment
- **Database:** Uses production Supabase (no local DB)
- **Port:** Always runs on 3002

## 🎯 Quick Tasks

### Test Business Creation
1. Enable dev_auth_bypass
2. Go to `/dashboard/create-business`
3. Create business profile
4. Verify prompt pages access

### Test Prompt Page Creation
1. Complete business profile
2. Go to `/prompt-pages`
3. Create new prompt page
4. Test public page rendering

### Debug Issues
1. Check browser console for errors
2. Check terminal for API logs
3. Verify dev_auth_bypass is enabled
4. Check network tab for API calls

---

**Need help?** Check the full documentation in `README.md` or `promptreviews.md`
