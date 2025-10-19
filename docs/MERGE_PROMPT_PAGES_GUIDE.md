# How to Merge Existing Prompt Page Content

Since you already have some content for certain prompt page types, here's how to selectively add the new comprehensive content I've created.

## Recommended Approach: Manual Review & Merge

### Step 1: Check What Exists
Go to your help content CMS and check which articles already exist:
- https://app.promptreviews.app/dashboard/help-content

Look for slugs:
- `prompt-pages/types/universal`
- `prompt-pages/types/location`
- `prompt-pages/types/service`
- `prompt-pages/types/product`
- `prompt-pages/types/employee`
- `prompt-pages/types/event`
- `prompt-pages/types/photo`
- `prompt-pages/types/video`

### Step 2: For Each Existing Article

**Option A: Keep Your Content, Add My Sections**
1. Open the existing article in CMS
2. Review my comprehensive version (in the SQL files)
3. Copy sections you're missing:
   - FAQs (I wrote 5-7 Q&As per article)
   - Best Practices sections
   - "How It Works" steps
   - Comparison tables
   - Advanced features sections

**Option B: Keep Your Content, Add My Metadata**
Your existing content is probably great! You might just need the metadata I created:
1. Open the existing article
2. Copy the `metadata` JSON from my SQL file
3. Paste into the metadata editor
4. This adds:
   - `key_features` - Feature cards with icons
   - `how_it_works` - Step-by-step process cards
   - `best_practices` - Tips section
   - `faqs` - Q&A section
   - `call_to_action` - CTA buttons

**Option C: Compare Side-by-Side**
1. Export your existing content
2. Compare with my version
3. Cherry-pick the best parts of both
4. Create a merged version

### Step 3: For Missing Articles

For articles that don't exist yet (like Location pages), you can:
1. Copy my SQL INSERT statement
2. Run it directly against production
3. Or copy/paste into CMS

## What to Do Right Now

Tell me which articles you already have content for, and I can:

1. **Extract just the metadata** from my versions (for the docs site features)
2. **Extract specific sections** you want to add (like FAQs or best practices)
3. **Focus on writing ONLY the missing articles** (Location, etc.)
4. **Create a comparison** showing your content vs my content side-by-side

## Quick Check: What Articles Exist?

Can you tell me which of these already have content?
- [ ] Universal Prompt Pages
- [ ] Location Prompt Pages
- [ ] Service Review Pages
- [ ] Product Review Pages
- [ ] Employee Spotlight Pages
- [ ] Event & Space Pages
- [ ] Photo + Testimonial Pages
- [ ] Video Testimonial Pages
- [ ] Types Overview Page

Once I know what exists, I can:
- Skip articles you're happy with
- Provide metadata-only for articles that just need the JSON
- Write full articles for the ones that are missing or need major expansion

## My Recommendation

**For Universal Prompt Pages specifically:**

Since you mentioned you already have content for it, let me extract just the valuable additions from my version:

### What You Might Want to Add:

1. **FAQs Section** (from my metadata):
```json
"faqs": [
  {
    "question": "Can I change the URL after creating it?",
    "answer": "No, the slug (URL) is permanent to prevent broken links. Choose carefully when you create it."
  },
  {
    "question": "Do I need to collect email addresses?",
    "answer": "No—email is optional. However, collecting emails helps with follow-up and building your marketing list."
  },
  // ... 3 more FAQs
]
```

2. **Key Features Cards** (for the docs site):
```json
"key_features": [
  {
    "icon": "Globe",
    "title": "Works for Everyone",
    "description": "One URL that any customer can use. No personalization needed."
  },
  // ... 3 more features
]
```

3. **Best Practices Section**:
```json
"best_practices": [
  {
    "icon": "Sparkles",
    "title": "Choose a Memorable URL",
    "description": "Pick a short, easy-to-remember slug for your Universal Page URL."
  },
  // ... 3 more practices
]
```

Would you like me to extract JUST these supplementary pieces for the articles you already have?
