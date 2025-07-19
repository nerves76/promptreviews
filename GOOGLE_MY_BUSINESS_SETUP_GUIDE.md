# Google My Business API Setup Guide - Post Approval

## 🎉 Congratulations on Your Google API Approval!

Your PromptReviews application already has **complete Google My Business posting functionality** built-in. You just need to configure it with your approved credentials.

## ✅ What You Already Have Working:
- Complete OAuth authentication flow
- Business locations fetching and management  
- Full posting functionality with templates
- Tabbed UI separating authentication from posting
- Rate limiting and error handling
- Recent fixes (January 2025) for all known issues

## 🔧 Required Setup Steps:

### Step 1: Enable Required APIs in Google Cloud Console

In your **approved** Google Cloud project, enable these 8 APIs:

1. **Google My Business API** (v4.9) - Core functionality
2. **My Business Account Management API** - Account management
3. **My Business Business Information API** - Location data
4. **My Business Place Actions API** - Action buttons
5. **My Business Notifications API** - Notifications
6. **My Business Verifications API** - Verification process
7. **My Business Q&A API** - Q&A management  
8. **Business Profile Performance API** - Analytics

**How to enable:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your approved project
3. Navigate to "APIs & Services" > "Library"
4. Search for each API and click "Enable"

### Step 2: Update Your Environment Variables

Replace your `.env.local` with your approved credentials:

```bash
# Google OAuth Configuration (UPDATE WITH YOUR APPROVED CREDENTIALS)
GOOGLE_CLIENT_ID=your_approved_client_id_here
GOOGLE_CLIENT_SECRET=your_approved_client_secret_here
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/google/callback

# For development (if still testing locally)
# GOOGLE_REDIRECT_URI=http://localhost:3002/api/auth/google/callback
```

### Step 3: OAuth Client Configuration

In Google Cloud Console > "Credentials":

1. **Update your OAuth client ID** with these settings:
   - **Authorized JavaScript origins:**
     - `https://yourdomain.com` (production)
     - `http://localhost:3002` (development)
   
   - **Authorized redirect URIs:**
     - `https://yourdomain.com/api/auth/google/callback` (production)
     - `http://localhost:3002/api/auth/google/callback` (development)

### Step 4: Test Your Setup

1. **Navigate to your social posting dashboard:**
   ```
   https://yourdomain.com/dashboard/social-posting
   ```

2. **Follow the flow:**
   - Go to "Platform Connections" tab
   - Click "Connect Google Business"
   - Complete OAuth with your approved account
   - Fetch your business locations
   - Switch to "Create & Post" tab
   - Start posting!

## 🎯 **Tabbed Authentication Structure**

Your new interface separates concerns cleanly:

### **Tab 1: Platform Connections**
- ✅ Google Business Profile authentication
- ✅ Connection status and management
- ✅ Business locations fetching
- ✅ Future platform integrations (Facebook, Instagram, etc.)

### **Tab 2: Create & Post**
- ✅ Location selection
- ✅ Post type selection (What's New, Event, Offer, Product)
- ✅ Content templates
- ✅ Character limit validation
- ✅ Publishing to Google

### **Tab 3: Analytics** (Coming Soon)
- 📊 Post performance metrics
- 📈 Engagement analytics
- 🎯 Audience insights

## 🔍 **Important Notes:**

### **Rate Limits:**
- Google My Business API: **1 request per minute** for locations
- Your app handles this automatically with proper error messages

### **Verification Requirements:**
- Your business locations must be **verified** on Google Business Profile
- Unverified locations won't appear in posting interface

### **Content Policies:**
- Posts must comply with [Google Business Profile policies](https://support.google.com/business/answer/7213077)
- No phone numbers in post content (use call buttons instead)
- Character limit: 1,500 characters

## 🚨 **Troubleshooting:**

### **"Authentication Error" Messages:**
1. Verify all 8 APIs are enabled
2. Check OAuth redirect URIs match exactly
3. Ensure your project has API access approval

### **"No Business Locations Found":**
1. Use "Fetch Business Locations" button
2. Wait for rate limit cooldowns (5 minutes)
3. Verify your business locations on [Google Business Profile](https://business.google.com)

### **"Rate Limit Exceeded":**
- This is normal for new connections
- Wait 5 minutes between location fetch attempts
- Consider creating additional Google Cloud projects for more quota

## 🎉 **Next Steps:**

1. **Test thoroughly** with your approved credentials
2. **Verify business locations** are showing up correctly
3. **Create test posts** to ensure everything works
4. **Monitor for any API errors** in your logs

## 🔮 **Future Enhancements:**

Your tabbed structure is ready for:
- **Facebook Business** integration
- **Instagram Business** integration  
- **LinkedIn Company Pages**
- **Post scheduling** functionality
- **Advanced analytics** and reporting

## 📞 **Need Help?**

Your system is fully functional - any issues are likely configuration related. Check:
1. Environment variables are correct
2. All APIs are enabled in your approved project
3. OAuth settings match your domain
4. Business locations are verified on Google

**Your Google My Business posting is ready to go! 🚀**