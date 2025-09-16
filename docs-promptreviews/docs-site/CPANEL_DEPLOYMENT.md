# cPanel Deployment Guide - Namecheap Shared Hosting

This guide shows you how to deploy the documentation site to your Namecheap shared hosting with cPanel.

## 🚀 **Step-by-Step Instructions**

### **Step 1: Build Static Files (Already Done)**

The static files have been built and are in the `out/` folder. These are ready to upload.

### **Step 2: Access cPanel**

1. Log into your Namecheap hosting account
2. Go to your hosting control panel
3. Click on "cPanel" or "Control Panel"

### **Step 3: Create the docs Directory**

1. In cPanel, find **"File Manager"**
2. Navigate to your **public_html** folder (this is your website root)
3. Click **"Create New Folder"**
4. Name it **"docs"**
5. Click **"Create New Folder"**

### **Step 4: Upload Files**

**Option A: Using File Manager (Recommended for small sites)**

1. Open the **docs** folder you just created
2. Click **"Upload"** at the top
3. Select all files from the `out/` folder on your computer
4. Upload them to the docs folder

**Option B: Using FTP (Faster for large sites)**

1. In cPanel, find **"FTP Accounts"**
2. Create an FTP account or use your main account
3. Use an FTP client (FileZilla, Cyberduck, etc.)
4. Connect to your server
5. Navigate to `public_html/docs/`
6. Upload all files from the `out/` folder

### **Step 5: Set Permissions**

1. In File Manager, select all files in the docs folder
2. Right-click and choose **"Change Permissions"**
3. Set folders to **755**
4. Set files to **644**

### **Step 6: Test Your Site**

Visit: `https://yoursite.com/docs/`

You should see your documentation site!

## 📁 **File Structure After Upload**

```
public_html/
├── wp-content/          # WordPress files
├── wp-admin/           # WordPress admin
├── docs/               # Documentation site
│   ├── _next/         # Next.js assets
│   ├── getting-started/
│   ├── prompt-pages/
│   ├── index.html
│   └── ... (all other files)
└── index.php          # WordPress entry point
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **404 Errors**
   - Make sure all files were uploaded to the correct folder
   - Check that the docs folder is in `public_html/docs/`

2. **Broken Images/CSS**
   - Verify that the `_next` folder was uploaded completely
   - Check file permissions (should be 644 for files, 755 for folders)

3. **Links Not Working**
   - The basePath configuration should handle this automatically
   - If issues persist, check that all HTML files were uploaded

### **cPanel-Specific Tips:**

- **File Manager**: Use this for small uploads (under 50MB)
- **FTP**: Use this for larger uploads or if File Manager times out
- **Backup**: Always backup your existing files before uploading
- **Permissions**: cPanel usually sets correct permissions automatically

## 🔄 **Updating the Site**

To update your documentation site:

1. **Rebuild locally:**
   ```bash
   cd docs-promptreviews/docs-site
   npm run build:prod
   ```

2. **Upload new files:**
   - Delete old files from `public_html/docs/`
   - Upload new files from the `out/` folder

3. **Test the site:**
   - Visit `https://yoursite.com/docs/`
   - Check that all pages work correctly

## 🎯 **Final Result**

After following these steps, you'll have:
- ✅ WordPress site at `https://yoursite.com/`
- ✅ Documentation site at `https://yoursite.com/docs/`
- ✅ Both sites working independently
- ✅ SEO benefits from having docs on your main domain

## 📞 **Need Help?**

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all files were uploaded correctly
3. Contact Namecheap support if it's a hosting issue
4. Check the browser console for JavaScript errors

Your documentation site should now be live at `https://yoursite.com/docs/`!
