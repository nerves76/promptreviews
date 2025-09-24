# Deploy Google Biz Optimizer Articles to Docs Site

## Overview
These Google Biz Optimizer™ help articles need to be deployed to the public docs site at `promptreviews.app/docs/google-biz-optimizer/`.

## Directory Structure
The articles should be uploaded maintaining this structure:

```
/docs/google-biz-optimizer/
├── overview.md
├── metrics/
│   ├── total-reviews.md
│   ├── average-rating.md
│   ├── review-trends.md
│   └── monthly-patterns.md
├── optimization/
│   ├── seo-score.md
│   ├── categories.md
│   ├── services.md
│   ├── photos.md
│   └── quick-wins.md
├── engagement/
│   ├── review-responses.md
│   ├── questions-answers.md
│   └── posts.md
├── performance/
│   └── customer-actions.md
└── conversion/
    ├── call-conversion.md (if exists)
    └── website-traffic.md (if exists)
```

## Integration Points
Once deployed, the articles will be accessible at:
- Base URL: `https://promptreviews.app/docs/google-biz-optimizer/`
- Example: `https://promptreviews.app/docs/google-biz-optimizer/metrics/total-reviews`

## Current Status
✅ Articles are currently being served locally from `/docs/help/google-biz-optimizer/`
⏳ Awaiting deployment to the public docs site
📝 The API will automatically fetch from the docs site once deployed

## Deployment Steps
1. Upload all `.md` files from this directory to the docs site
2. Maintain the directory structure
3. Ensure proper routing is configured on the docs site
4. Test that articles are accessible via the public URLs
5. Remove the local fallback in the API once confirmed working

## Article Features
All articles include:
- Industry benchmarks and statistics
- Actionable insights and strategies
- Psychology and conversion tips
- Templates and examples
- ROI calculations where applicable
- Platform-specific best practices

## Notes
- Articles use standard Markdown formatting
- Images/assets referenced should be uploaded alongside
- The API in `fetch-from-docs/route.ts` will automatically use the docs site once articles are live