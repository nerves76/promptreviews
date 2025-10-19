-- Fix Service Review Pages Article
-- Run this if the service article didn't populate correctly

UPDATE articles
SET
  content = '# Service Review Pages: Perfect for Professional Services

Service Review Pages are designed for businesses that provide professional services to clients—from plumbing and consulting to legal services and healthcare.

## What Are Service Review Pages?

Service Review Pages are **personalized prompt pages** created for individual clients after you complete a service for them. Each page is pre-filled with:
- Client''s name
- Service provided
- Date of service
- Custom thank-you message

## Why Use Service Review Pages?

### Personalization Increases Response
When customers see their name and the specific service you provided, they''re **3-5x more likely** to leave a review compared to generic requests.

### Perfect for Professional Services
Ideal for businesses where each client interaction is unique:
- Consulting
- Legal services
- Accounting/Tax prep
- Home services (plumbing, HVAC, electrical)
- Healthcare/Dental
- Financial advising
- Real estate
- Veterinary services

### Follow-Up Made Easy
After completing a service, simply:
1. Create a prompt page with client details
2. Send them the unique link
3. They write their review
4. You track the submission

## How They Work

### Creation Process
1. **After completing service**, go to your dashboard
2. **Click "Create Service Review Page"**
3. **Fill in details:**
   - Client first and last name
   - Service performed (e.g., "kitchen remodel", "tax preparation")
   - Date of service
   - Custom message (optional)
4. **Send the link** via email, text, or share in person

### Client Experience
1. Client clicks their unique link
2. Sees personalized page: "Hi [Name]! Thanks for choosing us for your [Service]"
3. Writes review (with AI assistance if needed)
4. Chooses review platform (Google, Yelp, etc.)
5. Submits

### Your Dashboard
- See which clients have/haven''t reviewed
- Track review content and ratings
- Send gentle reminders to non-responders
- Mark reviews as verified

## Service Pages vs Universal Pages

| Feature | Service Pages | Universal Page |
|---------|--------------|----------------|
| **Personalization** | Full (name, service, date) | None |
| **Response rate** | 25-40% | 10-20% |
| **Setup time** | 2 min per client | One-time |
| **Best for** | High-value clients | Walk-ins, general |
| **URL** | Unique per client | Same for everyone |

**Strategy:** Use Service Pages for all clients; use Universal for walk-ins who want to review immediately.

## Setup & Distribution

### Creating Pages Efficiently

**Option 1: One at a Time**
- Best for: Small volume, VIP clients
- Time: 2 minutes per page

**Option 2: Bulk Creation**
- Upload CSV with client list
- Pre-fill all client data
- Generate pages in bulk
- Available on Builder+ plans

**Option 3: Integration**
- Connect to your CRM/booking system
- Auto-create pages after service completion
- Available on Maven+ plans

### Sending the Link

**Email (Most Common)**
```
Subject: Thank you for choosing [Your Business]!

Hi [Client Name],

Thank you for trusting us with your [Service]! We hope you''re thrilled with the results.

If you have a moment, we''d love to hear about your experience:
[Unique Review Link]

It takes less than 2 minutes, and your feedback helps other customers find us.

Thank you!
[Your Name]
```

**Text Message**
```
Hi [Name]! Thanks for choosing [Business] for your [Service]. We''d love your feedback: [Short Link]
```

**In Person**
"Thank you so much! I''ve sent you a quick link to share your experience if you have a moment. Your feedback really helps us!"

## Advanced Service Page Features

### Service Type Tracking
Tag pages by service type:
- "Kitchen Remodel"
- "Tax Preparation"
- "Root Canal"
- "Transmission Repair"

Then analyze:
- Which services get the best reviews?
- Which services need improvement?
- Which generate the most reviews?

### Custom Thank You Messages
Personalize beyond the basics:
- Reference specific aspects of the service
- Mention team members by name
- Include follow-up info or next steps
- Add warranty/guarantee reminders

### Follow-Up Sequences
Automated reminder system:
- **Day 1**: Send review request
- **Day 3**: Gentle reminder if no response
- **Day 7**: Final reminder
- **Stop** if they respond

### Review Incentive Tracking
If you offer incentives:
- Track who receives what incentive
- Measure incentive effectiveness
- Comply with platform guidelines

## Best Practices

### Timing Matters
**Send review requests:**
- ✅ Within 24 hours of service completion
- ✅ When customer expresses satisfaction
- ✅ After final payment/invoice
- ❌ Immediately after (they need time to experience results)
- ❌ Weeks later (they''ve forgotten details)

### Messaging Tips
1. **Be grateful**: Thank them for their business first
2. **Be specific**: Mention the actual service provided
3. **Be brief**: Don''t write an essay
4. **Make it easy**: One-click link, no barriers
5. **Don''t beg**: Ask confidently, not desperately

### What to Pre-Fill

**Always include:**
- Client name
- Service description
- Date of service

**Consider adding:**
- Service location (if relevant)
- Technician/provider name
- Project details or outcomes
- Special accommodations made

### Managing Non-Responses
If a client doesn''t review:
1. **Day 3**: Send a friendly reminder
2. **Day 7**: Last reminder with slightly different message
3. **Stop there**: Don''t spam them

Mark them as "not interested" in your system and move on.

## Common Questions

**Q: Should I create a page for every single customer?**
A: Focus on satisfied customers who had a positive experience. No need to request reviews from unhappy clients.

**Q: Can I edit the page after sending the link?**
A: You can edit the custom message, but changing the client name or service details may confuse them.

**Q: What if the client was unhappy?**
A: Don''t send a review request. Instead, follow up to resolve their issue first, then consider requesting a review later.

**Q: How long do Service Pages stay active?**
A: Indefinitely, but you can set them to expire after a certain timeframe (e.g., 30 days).

**Q: Can I reuse a page for the same client?**
A: No—each service gets its own page. If they return, create a new one referencing the new service.

## Measuring Success

### Key Metrics
- **Response rate**: % of clients who leave reviews
  - Target: 25-40%
- **Average rating**: Overall sentiment
  - Target: 4.5+ stars
- **Time to review**: How quickly they respond
  - Target: <3 days
- **Platform distribution**: Where they post
  - Track to focus marketing efforts

### Improving Response Rates
1. **Test timing**: Try 4 hours vs 24 hours vs 48 hours
2. **Test messaging**: Compare friendly vs professional tone
3. **Test incentives**: Offer (compliant) thank-you gifts
4. **Test channels**: Email vs text vs both
5. **Analyze by service type**: Which services convert best?

## Integration with Your Workflow

### For Home Services
- Create page when closing work order
- Include in digital invoice
- Reference in follow-up call

### For Professional Services
- Create after final deliverable
- Include in project wrap-up email
- Reference in thank-you note

### For Healthcare/Dental
- Create after appointment
- Send in appointment reminder/follow-up
- Train front desk to mention

### For Consulting
- Create after project milestone
- Include in final report delivery
- Reference in closing meeting

Service Review Pages transform your review collection from generic blasts to personalized requests—dramatically improving response rates and review quality.',
  updated_at = NOW()
WHERE slug = 'prompt-pages/types/service';

-- Verify the update
SELECT slug, title, LENGTH(content) as content_length, status
FROM articles
WHERE slug = 'prompt-pages/types/service';
