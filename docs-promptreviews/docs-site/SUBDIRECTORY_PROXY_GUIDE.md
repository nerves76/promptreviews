# Subdirectory Proxy Guide

This guide shows you how to make the docs site appear at `yoursite.com/docs/` while keeping it hosted at `docs.promptreviews.app`.

## 🎯 **Recommended Options (Best to Worst)**

### **Option 1: Reverse Proxy (Most Professional) ⭐⭐⭐⭐⭐**

**Pros:**
- ✅ Seamless user experience
- ✅ SEO benefits (content on your domain)
- ✅ No redirects or iframes
- ✅ Maintains all functionality

**Setup:**
1. Add this to your WordPress `.htaccess` file (in `public_html`):

```apache
# Proxy /docs/ requests to the docs site
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/docs/(.*)$
RewriteRule ^docs/(.*)$ https://docs.promptreviews.app/$1 [P,L]
ProxyPreserveHost On
ProxyPassReverse /docs/ https://docs.promptreviews.app/
```

2. Test by visiting `yoursite.com/docs/`

### **Option 2: CNAME with Redirect (Easy Setup) ⭐⭐⭐⭐**

**Pros:**
- ✅ Easy to set up
- ✅ Works with shared hosting
- ✅ Clean URLs

**Setup:**
1. **DNS Setup:** Add CNAME record:
   ```
   docs.yoursite.com CNAME docs.promptreviews.app
   ```

2. **Redirect Setup:** Add to WordPress `.htaccess`:
   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_URI} ^/docs/(.*)$
   RewriteRule ^docs/(.*)$ https://docs.yoursite.com/$1 [R=301,L]
   ```

3. Users visiting `yoursite.com/docs/` get redirected to `docs.yoursite.com`

### **Option 3: WordPress Page Template (Most Integrated) ⭐⭐⭐**

**Pros:**
- ✅ Full WordPress integration
- ✅ Customizable styling
- ✅ Analytics tracking

**Setup:**
1. Upload `wordpress-template.php` to your theme folder
2. Create a new WordPress page
3. Set the page template to "Documentation"
4. Set the page slug to "docs"

### **Option 4: Simple Iframe (Quickest) ⭐⭐**

**Pros:**
- ✅ Fastest to implement
- ✅ No server configuration needed

**Setup:**
1. Create a `docs` folder in `public_html`
2. Upload `proxy-page.html` as `index.html`
3. Visit `yoursite.com/docs/`

## 🔧 **Implementation Steps**

### **For Option 1 (Reverse Proxy):**

1. **Backup your current `.htaccess` file**
2. **Add the proxy rules to your `.htaccess`**
3. **Test the setup**
4. **Monitor for any issues**

### **For Option 2 (CNAME Redirect):**

1. **Add DNS record in Namecheap**
2. **Wait for DNS propagation (up to 24 hours)**
3. **Add redirect rules to `.htaccess`**
4. **Test the redirect**

### **For Option 3 (WordPress Template):**

1. **Upload template to your theme**
2. **Create new page in WordPress**
3. **Set template and slug**
4. **Test the page**

### **For Option 4 (Iframe):**

1. **Create docs folder in cPanel**
2. **Upload proxy-page.html**
3. **Rename to index.html**
4. **Test the page**

## 🚨 **Important Considerations**

### **SEO Impact:**
- **Option 1:** Best SEO (content on your domain)
- **Option 2:** Good SEO (redirects are followed)
- **Option 3:** Moderate SEO (WordPress page)
- **Option 4:** Poor SEO (iframe content not indexed)

### **Performance:**
- **Option 1:** Fastest (direct proxy)
- **Option 2:** Fast (redirect)
- **Option 3:** Moderate (WordPress overhead)
- **Option 4:** Slowest (iframe loading)

### **Functionality:**
- **Option 1:** Full functionality
- **Option 2:** Full functionality
- **Option 3:** Limited (iframe constraints)
- **Option 4:** Limited (iframe constraints)

## 🎯 **Recommendation**

**For your Namecheap shared hosting setup, I recommend Option 2 (CNAME with Redirect):**

1. **Easy to implement** with cPanel
2. **Works reliably** on shared hosting
3. **Good SEO benefits**
4. **Maintains full functionality**
5. **Easy to maintain**

## 🔄 **Updating the Docs Site**

With any of these options, the docs site updates automatically when you push changes to the main docs site - no need to upload files to your hosting!

## 📞 **Need Help?**

If you encounter issues:
1. Check your `.htaccess` syntax
2. Verify DNS propagation (for Option 2)
3. Test with a simple redirect first
4. Contact Namecheap support if needed
