-- Add Google Biz Optimizer email templates for lead nurturing

INSERT INTO public.email_templates (name, subject, html_content, text_content) VALUES
(
    'optimizer_welcome',
    'Your Google Business Profile Report is Ready! 📊',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://app.promptreviews.app/images/logo.png" alt="PromptReviews" style="height: 40px;">
      </div>

      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hi {{businessName}}, your report is ready! 🎉</h1>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Thanks for using our Google Business Profile Optimizer! Your personalized optimization report contains <strong>specific, actionable recommendations</strong> to help you:
      </p>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 10px;">🎯 <strong>Improve your local search ranking</strong></li>
          <li style="margin-bottom: 10px;">📈 <strong>Attract more customers</strong></li>
          <li style="margin-bottom: 10px;">⭐ <strong>Collect more positive reviews</strong></li>
          <li>🔍 <strong>Stand out from competitors</strong></li>
        </ul>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reportUrl}}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          📥 Download Your Report (PDF)
        </a>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0;">
        <p style="color: #1e40af; font-weight: bold; margin: 0 0 10px 0;">💡 Pro Tip:</p>
        <p style="color: #374151; margin: 0;">
          Most businesses see results within 2-4 weeks of implementing these recommendations. Start with the "Quick Wins" section for fastest impact!
        </p>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Need help implementing these changes? Our team at PromptReviews specializes in helping small businesses optimize their online presence and collect more reviews.
      </p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Best regards,<br>
          <strong>The PromptReviews Team</strong><br>
          <em>Helping small businesses get the reviews they deserve</em>
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">
          <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> |
          <a href="https://app.promptreviews.app" style="color: #9ca3af;">PromptReviews.app</a>
        </p>
      </div>
    </div>',
    'Hi {{businessName}}, your Google Business Profile report is ready! 🎉

Thanks for using our Google Business Profile Optimizer! Your personalized optimization report contains specific, actionable recommendations to help you:

🎯 Improve your local search ranking
📈 Attract more customers
⭐ Collect more positive reviews
🔍 Stand out from competitors

Download Your Report: {{reportUrl}}

💡 Pro Tip: Most businesses see results within 2-4 weeks of implementing these recommendations. Start with the "Quick Wins" section for fastest impact!

Need help implementing these changes? Our team at PromptReviews specializes in helping small businesses optimize their online presence and collect more reviews.

Best regards,
The PromptReviews Team
Helping small businesses get the reviews they deserve

Unsubscribe: {{unsubscribeUrl}}
PromptReviews.app'
),
(
    'optimizer_followup',
    'Did you download your Google Business optimization report? 📈',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://app.promptreviews.app/images/logo.png" alt="PromptReviews" style="height: 40px;">
      </div>

      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hi {{businessName}} 👋</h1>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        I noticed you haven''t downloaded your <strong>Google Business Profile optimization report</strong> yet.
      </p>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0;">
        <p style="color: #92400e; font-weight: bold; margin: 0 0 10px 0;">⏰ Don''t miss out!</p>
        <p style="color: #374151; margin: 0;">
          Your personalized report contains <strong>10+ specific recommendations</strong> that could help you attract more customers this month.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reportUrl}}" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          📥 Get Your Report Now
        </a>
      </div>

      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #1f2937; margin: 0 0 15px 0;">What''s inside your report:</h3>
        <ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;">✅ Current optimization score</li>
          <li style="margin-bottom: 8px;">🎯 Quick wins for immediate impact</li>
          <li style="margin-bottom: 8px;">📊 Competitor comparison insights</li>
          <li style="margin-bottom: 8px;">📝 Step-by-step action plan</li>
          <li>⭐ Review collection strategies</li>
        </ul>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        <strong>It takes just 2 minutes to review</strong>, and the recommendations could make a real difference for your business visibility.
      </p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Questions? Just reply to this email - I''m here to help!<br><br>
          Best regards,<br>
          <strong>The PromptReviews Team</strong>
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">
          <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> |
          <a href="https://app.promptreviews.app" style="color: #9ca3af;">PromptReviews.app</a>
        </p>
      </div>
    </div>',
    'Hi {{businessName}} 👋

I noticed you haven''t downloaded your Google Business Profile optimization report yet.

⏰ Don''t miss out! Your personalized report contains 10+ specific recommendations that could help you attract more customers this month.

Get Your Report: {{reportUrl}}

What''s inside your report:
✅ Current optimization score
🎯 Quick wins for immediate impact
📊 Competitor comparison insights
📝 Step-by-step action plan
⭐ Review collection strategies

It takes just 2 minutes to review, and the recommendations could make a real difference for your business visibility.

Questions? Just reply to this email - I''m here to help!

Best regards,
The PromptReviews Team

Unsubscribe: {{unsubscribeUrl}}
PromptReviews.app'
),
(
    'optimizer_nurture_tips',
    '5 Quick Google Business Profile Wins (Takes 15 minutes) 🚀',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://app.promptreviews.app/images/logo.png" alt="PromptReviews" style="height: 40px;">
      </div>

      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hi {{businessName}} ⭐</h1>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Here are <strong>5 quick optimizations</strong> you can implement in the next 15 minutes to boost your Google Business Profile visibility:
      </p>

      <div style="background: #f0f9ff; border-left: 4px solid #0ea5e9; padding: 20px; margin: 20px 0;">
        <h3 style="color: #0369a1; margin: 0 0 15px 0;">🚀 Quick Win #1: Complete Your Business Hours</h3>
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
          Profiles with complete hours get 2x more views. Include holiday hours and special opening times.
        </p>
      </div>

      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
        <h3 style="color: #047857; margin: 0 0 15px 0;">📸 Quick Win #2: Add 10+ High-Quality Photos</h3>
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
          Businesses with more photos get 42% more direction requests. Include exterior, interior, team, and product shots.
        </p>
      </div>

      <div style="background: #fefce8; border-left: 4px solid #eab308; padding: 20px; margin: 20px 0;">
        <h3 style="color: #a16207; margin: 0 0 15px 0;">🏷️ Quick Win #3: Select All Relevant Attributes</h3>
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
          Choose attributes like "Women-owned," "Accepts credit cards," or "Free Wi-Fi" - they help customers find you.
        </p>
      </div>

      <div style="background: #fdf4ff; border-left: 4px solid #a855f7; padding: 20px; margin: 20px 0;">
        <h3 style="color: #7c2d12; margin: 0 0 15px 0;">📝 Quick Win #4: Write a Compelling Description</h3>
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
          Include what makes you unique, your specialties, and why customers love you. Keep it under 750 characters.
        </p>
      </div>

      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0;">
        <h3 style="color: #991b1b; margin: 0 0 15px 0;">💬 Quick Win #5: Respond to Recent Reviews</h3>
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
          Responding to reviews (especially recent ones) shows you care and can improve your rating over time.
        </p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reportUrl}}" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          📊 Get Your Full Report
        </a>
      </div>

      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 30px 0;">
        <p style="color: #1e40af; font-weight: bold; margin: 0 0 10px 0;">💡 Did you know?</p>
        <p style="color: #374151; margin: 0;">
          Businesses that optimize their Google Profile see an average <strong>25% increase</strong> in customer actions (calls, visits, direction requests) within 3 months.
        </p>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Want help implementing a complete optimization strategy? PromptReviews can automate your review collection and help improve your online presence.
      </p>

      <div style="text-align: center; margin: 20px 0;">
        <a href="https://app.promptreviews.app/auth/sign-up" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          Try PromptReviews Free
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Hope this helps!<br><br>
          Best regards,<br>
          <strong>The PromptReviews Team</strong>
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">
          <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> |
          <a href="https://app.promptreviews.app" style="color: #9ca3af;">PromptReviews.app</a>
        </p>
      </div>
    </div>',
    'Hi {{businessName}} ⭐

Here are 5 quick optimizations you can implement in the next 15 minutes to boost your Google Business Profile visibility:

🚀 Quick Win #1: Complete Your Business Hours
Profiles with complete hours get 2x more views. Include holiday hours and special opening times.

📸 Quick Win #2: Add 10+ High-Quality Photos
Businesses with more photos get 42% more direction requests. Include exterior, interior, team, and product shots.

🏷️ Quick Win #3: Select All Relevant Attributes
Choose attributes like "Women-owned," "Accepts credit cards," or "Free Wi-Fi" - they help customers find you.

📝 Quick Win #4: Write a Compelling Description
Include what makes you unique, your specialties, and why customers love you. Keep it under 750 characters.

💬 Quick Win #5: Respond to Recent Reviews
Responding to reviews (especially recent ones) shows you care and can improve your rating over time.

Get Your Full Report: {{reportUrl}}

💡 Did you know? Businesses that optimize their Google Profile see an average 25% increase in customer actions (calls, visits, direction requests) within 3 months.

Want help implementing a complete optimization strategy? PromptReviews can automate your review collection and help improve your online presence.

Try PromptReviews Free: https://app.promptreviews.app/auth/sign-up

Hope this helps!

Best regards,
The PromptReviews Team

Unsubscribe: {{unsubscribeUrl}}
PromptReviews.app'
),
(
    'optimizer_case_study',
    'How Sarah''s Restaurant Increased Customers by 40% 📈',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://app.promptreviews.app/images/logo.png" alt="PromptReviews" style="height: 40px;">
      </div>

      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hi {{businessName}} 👋</h1>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        I wanted to share an inspiring success story from one of our clients that shows what''s possible when you optimize your Google Business Profile properly.
      </p>

      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 12px; padding: 30px; margin: 30px 0;">
        <h2 style="color: #0c4a6e; margin: 0 0 20px 0; text-align: center;">📈 Case Study: Sarah''s Family Restaurant</h2>

        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">The Challenge:</h3>
          <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.6;">
            Sarah''s restaurant had been open for 3 years but struggled with online visibility. She had only 12 Google reviews and her business rarely appeared in local searches.
          </p>
        </div>

        <div style="background: white; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin: 0 0 15px 0;">What We Did:</h3>
          <ul style="color: #374151; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">✅ Optimized her Google Business Profile with complete info</li>
            <li style="margin-bottom: 8px;">📸 Added 25 mouth-watering food photos</li>
            <li style="margin-bottom: 8px;">⭐ Implemented our review collection system</li>
            <li style="margin-bottom: 8px;">📝 Helped her respond to all existing reviews</li>
            <li>🎯 Set up automated review requests</li>
          </ul>
        </div>

        <div style="background: #dcfce7; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #166534; margin: 0 0 15px 0;">The Results (3 months later):</h3>
          <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
            <div style="text-align: center; margin: 10px;">
              <div style="font-size: 32px; font-weight: bold; color: #16a34a;">147</div>
              <div style="font-size: 12px; color: #374151;">Google Reviews</div>
              <div style="font-size: 10px; color: #16a34a;">+1125% increase</div>
            </div>
            <div style="text-align: center; margin: 10px;">
              <div style="font-size: 32px; font-weight: bold; color: #16a34a;">4.8</div>
              <div style="font-size: 12px; color: #374151;">Star Rating</div>
              <div style="font-size: 10px; color: #16a34a;">Up from 4.1</div>
            </div>
            <div style="text-align: center; margin: 10px;">
              <div style="font-size: 32px; font-weight: bold; color: #16a34a;">40%</div>
              <div style="font-size: 12px; color: #374151;">More Customers</div>
              <div style="font-size: 10px; color: #16a34a;">Monthly average</div>
            </div>
          </div>
        </div>
      </div>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
        <p style="color: #92400e; font-weight: bold; margin: 0 0 10px 0;">💡 Sarah''s #1 tip:</p>
        <p style="color: #374151; margin: 0; font-style: italic;">
          "The biggest game-changer was making it easy for happy customers to leave reviews. PromptReviews automated the whole process - I just focus on great food and service!"
        </p>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        <strong>The same strategies could work for your business.</strong> Whether you''re a restaurant, service business, or retail store, the principles are the same:
      </p>

      <ul style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px; padding-left: 20px;">
        <li style="margin-bottom: 10px;">🎯 Optimize your Google Business Profile completely</li>
        <li style="margin-bottom: 10px;">⭐ Make review collection systematic and easy</li>
        <li style="margin-bottom: 10px;">📸 Show your business with great photos</li>
        <li>💬 Engage with your customers online</li>
      </ul>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://app.promptreviews.app/auth/sign-up" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          🚀 Start Your Free Trial Today
        </a>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Want to see what''s possible for your business? Start with your <strong>free Google Business Profile optimization report</strong>:
      </p>

      <div style="text-align: center; margin: 20px 0;">
        <a href="{{reportUrl}}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
          📊 Download Your Report
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Rooting for your success!<br><br>
          Best regards,<br>
          <strong>The PromptReviews Team</strong>
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">
          <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> |
          <a href="https://app.promptreviews.app" style="color: #9ca3af;">PromptReviews.app</a>
        </p>
      </div>
    </div>',
    'Hi {{businessName}} 👋

I wanted to share an inspiring success story from one of our clients that shows what''s possible when you optimize your Google Business Profile properly.

📈 Case Study: Sarah''s Family Restaurant

The Challenge:
Sarah''s restaurant had been open for 3 years but struggled with online visibility. She had only 12 Google reviews and her business rarely appeared in local searches.

What We Did:
✅ Optimized her Google Business Profile with complete info
📸 Added 25 mouth-watering food photos
⭐ Implemented our review collection system
📝 Helped her respond to all existing reviews
🎯 Set up automated review requests

The Results (3 months later):
• 147 Google Reviews (+1125% increase)
• 4.8 Star Rating (up from 4.1)
• 40% More Customers (monthly average)

💡 Sarah''s #1 tip: "The biggest game-changer was making it easy for happy customers to leave reviews. PromptReviews automated the whole process - I just focus on great food and service!"

The same strategies could work for your business. Whether you''re a restaurant, service business, or retail store, the principles are the same:

🎯 Optimize your Google Business Profile completely
⭐ Make review collection systematic and easy
📸 Show your business with great photos
💬 Engage with your customers online

Start Your Free Trial: https://app.promptreviews.app/auth/sign-up

Want to see what''s possible for your business? Start with your free Google Business Profile optimization report:

Download Your Report: {{reportUrl}}

Rooting for your success!

Best regards,
The PromptReviews Team

Unsubscribe: {{unsubscribeUrl}}
PromptReviews.app'
),
(
    'optimizer_trial_offer',
    'Ready to 10x your Google reviews? Special offer inside 🎁',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <img src="https://app.promptreviews.app/images/logo.png" alt="PromptReviews" style="height: 40px;">
      </div>

      <h1 style="color: #1f2937; font-size: 24px; margin-bottom: 20px;">Hi {{businessName}} 🌟</h1>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        It''s been 2 weeks since you downloaded your Google Business Profile optimization report. I hope you found some helpful insights!
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
        Many business owners tell us the same thing: <em>"I know what to do, but I don''t have time to implement it all."</em>
      </p>

      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
        <h2 style="color: white; margin: 0 0 20px 0; font-size: 28px;">🎁 Special Offer</h2>
        <p style="color: #e0f2fe; margin: 0 0 20px 0; font-size: 18px;">
          <strong>Get your first month FREE</strong><br>
          <span style="font-size: 16px;">when you try PromptReviews today</span>
        </p>
        <div style="background: rgba(255,255,255,0.2); border-radius: 8px; padding: 15px; margin: 20px 0;">
          <div style="color: white; font-size: 14px;">Normally $29/month</div>
          <div style="color: white; font-size: 24px; font-weight: bold;">FREE for 30 days</div>
          <div style="color: #e0f2fe; font-size: 12px;">Then just $29/month, cancel anytime</div>
        </div>
      </div>

      <h3 style="color: #1f2937; margin: 30px 0 20px 0; text-align: center;">Here''s what you''ll get:</h3>

      <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
          <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; font-weight: bold;">1</div>
          <div>
            <h4 style="color: #1f2937; margin: 0 0 5px 0;">⭐ Automated Review Collection</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Send review requests via text and email automatically after each customer interaction.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
          <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; font-weight: bold;">2</div>
          <div>
            <h4 style="color: #1f2937; margin: 0 0 5px 0;">📱 Custom Review Pages</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Beautiful, mobile-optimized pages that guide customers to leave reviews on Google, Yelp, and Facebook.</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start; margin-bottom: 15px;">
          <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; font-weight: bold;">3</div>
          <div>
            <h4 style="color: #1f2937; margin: 0 0 5px 0;">🎯 Smart Follow-ups</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Automatically follow up with customers who haven''t left a review yet (with perfect timing).</p>
          </div>
        </div>
        <div style="display: flex; align-items: flex-start;">
          <div style="background: #3b82f6; color: white; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-size: 12px; font-weight: bold;">4</div>
          <div>
            <h4 style="color: #1f2937; margin: 0 0 5px 0;">📊 Review Analytics</h4>
            <p style="color: #6b7280; margin: 0; font-size: 14px;">Track your review growth, response rates, and see which platforms perform best.</p>
          </div>
        </div>
      </div>

      <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 30px 0;">
        <p style="color: #166534; font-weight: bold; margin: 0 0 10px 0;">✨ Success Story:</p>
        <p style="color: #374151; margin: 0; font-size: 14px; line-height: 1.5;">
          "In 6 months, we went from 23 to 180+ Google reviews with a 4.9 rating. Our phone hasn''t stopped ringing!" - Mike, Plumbing Contractor
        </p>
      </div>

      <div style="text-align: center; margin: 40px 0;">
        <a href="https://app.promptreviews.app/auth/sign-up?promo=OPTIMIZER30" style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 18px 36px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">
          🚀 Start Your FREE Month
        </a>
        <p style="color: #6b7280; font-size: 12px; margin: 10px 0 0 0;">
          No credit card required • Cancel anytime • Setup takes 5 minutes
        </p>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 20px; margin: 30px 0;">
        <p style="color: #92400e; font-weight: bold; margin: 0 0 10px 0;">⏰ Limited Time Offer</p>
        <p style="color: #374151; margin: 0; font-size: 14px;">
          This free month offer is only available for the next <strong>48 hours</strong>. After that, you''ll need to pay the regular monthly fee to get started.
        </p>
      </div>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
        Ready to stop worrying about getting more reviews and start seeing real results? Let''s make it happen together.
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="{{reportUrl}}" style="color: #3b82f6; text-decoration: underline; font-size: 14px;">
          📊 Review your optimization report first
        </a>
      </div>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 30px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0;">
          Questions? Just reply to this email - I personally read every message.<br><br>
          Excited to help you succeed!<br>
          <strong>The PromptReviews Team</strong>
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px;">
          <a href="{{unsubscribeUrl}}" style="color: #9ca3af;">Unsubscribe</a> |
          <a href="https://app.promptreviews.app" style="color: #9ca3af;">PromptReviews.app</a>
        </p>
      </div>
    </div>',
    'Hi {{businessName}} 🌟

It''s been 2 weeks since you downloaded your Google Business Profile optimization report. I hope you found some helpful insights!

Many business owners tell us the same thing: "I know what to do, but I don''t have time to implement it all."

🎁 SPECIAL OFFER: Get your first month FREE when you try PromptReviews today

Normally $29/month → FREE for 30 days
Then just $29/month, cancel anytime

Here''s what you''ll get:

1. ⭐ Automated Review Collection
Send review requests via text and email automatically after each customer interaction.

2. 📱 Custom Review Pages
Beautiful, mobile-optimized pages that guide customers to leave reviews on Google, Yelp, and Facebook.

3. 🎯 Smart Follow-ups
Automatically follow up with customers who haven''t left a review yet (with perfect timing).

4. 📊 Review Analytics
Track your review growth, response rates, and see which platforms perform best.

✨ Success Story: "In 6 months, we went from 23 to 180+ Google reviews with a 4.9 rating. Our phone hasn''t stopped ringing!" - Mike, Plumbing Contractor

Start Your FREE Month: https://app.promptreviews.app/auth/sign-up?promo=OPTIMIZER30

⏰ LIMITED TIME: This free month offer is only available for the next 48 hours. After that, you''ll need to pay the regular monthly fee to get started.

Ready to stop worrying about getting more reviews and start seeing real results? Let''s make it happen together.

Review your optimization report: {{reportUrl}}

Questions? Just reply to this email - I personally read every message.

Excited to help you succeed!
The PromptReviews Team

No credit card required • Cancel anytime • Setup takes 5 minutes

Unsubscribe: {{unsubscribeUrl}}
PromptReviews.app'
);