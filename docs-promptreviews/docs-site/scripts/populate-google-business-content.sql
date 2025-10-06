-- Populate Google Business Profile article
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{key_features}',
      '[
        {
          "icon": "Star",
          "title": "Review Management",
          "description": "View and respond to Google reviews directly from Prompt Reviews. Track review trends and maintain your reputation with quick response capabilities."
        },
        {
          "icon": "MessageSquare",
          "title": "Posts & Updates",
          "description": "Create and schedule Google Business Profile posts about updates, offers, and events. Keep your profile active and engaging."
        },
        {
          "icon": "MapPin",
          "title": "Multiple Locations",
          "description": "Manage multiple business profiles from one dashboard. Perfect for franchises and multi-location businesses with centralized control."
        },
        {
          "icon": "Upload",
          "title": "Review Import",
          "description": "Import existing Google reviews to feature on your website, launch double-dip campaigns, or track customer engagement.",
          "href": "/double-dip-strategy"
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "title": "Sign In with Google",
        "description": "Click \"Connect Google Business\" and sign in with the Google account that manages your business profile. You must be an owner or manager of the Google Business Profile to connect it.",
        "icon": "Link2"
      },
      {
        "number": 2,
        "title": "Grant Permissions",
        "description": "Authorize Prompt Reviews to access your business information, reviews, and posting capabilities. We only request the minimum permissions needed.",
        "icon": "Shield"
      },
      {
        "number": 3,
        "title": "Select Your Business",
        "description": "Choose which business location(s) to connect. You can add more locations later if needed. Perfect for multi-location businesses.",
        "icon": "MapPin"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Clock",
      "title": "Respond Quickly to Reviews",
      "description": "Google rewards businesses that respond within 24 hours with increased visibility. Quick responses improve your local search ranking and show customers you care."
    },
    {
      "icon": "MessageSquare",
      "title": "Keep Responses Personal",
      "description": "Avoid generic copy-paste responses. Thank customers by name, address specific concerns, and include your business name naturally in responses."
    },
    {
      "icon": "Upload",
      "title": "Post Regularly",
      "description": "Keep your Google Business Profile active with weekly posts about updates, offers, and events. Posts appear for 7 days, so maintain a consistent schedule."
    },
    {
      "icon": "Shield",
      "title": "Handle Negative Reviews Professionally",
      "description": "Address concerns professionally without arguing. Offer to resolve issues offline and show potential customers how you handle problems."
    }
  ]'::jsonb
)
WHERE slug = 'google-business';

-- Populate Google Business Review Import article
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{key_features}',
      '[
        {
          "icon": "Download",
          "title": "Automatic sync",
          "description": "Connect your Google Business Profile using OAuth to automatically import all existing reviews. The system syncs regularly to capture new reviews as they come in."
        },
        {
          "icon": "Building2",
          "title": "Website display",
          "description": "Once imported, display your Google reviews on your website using Prompt Reviews widgets. Choose from multiple widget styles and customize the appearance to match your brand."
        },
        {
          "icon": "Star",
          "title": "Double-dip campaigns",
          "description": "Leverage existing Google reviewers to gather reviews on other platforms. Since these customers already took time to review you once, they are more likely to help again."
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "icon": "Download",
        "title": "Import reviews",
        "description": "Import Google reviews to identify satisfied customers"
      },
      {
        "number": 2,
        "icon": "Star",
        "title": "Filter reviewers",
        "description": "Filter by 4 and 5-star reviewers who are likely to leave positive reviews elsewhere"
      },
      {
        "number": 3,
        "icon": "Building2",
        "title": "Reach out",
        "description": "Reach out via email or SMS asking them to share their experience on Facebook, Yelp, or other platforms"
      },
      {
        "number": 4,
        "icon": "Star",
        "title": "Track results",
        "description": "Track which customers respond to avoid duplicate requests"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Download",
      "title": "Time it right",
      "description": "Wait 2-4 weeks after their Google review before asking for another platform"
    },
    {
      "icon": "Star",
      "title": "Personalize the ask",
      "description": "Reference their original Google review to show you remember them"
    },
    {
      "icon": "Building2",
      "title": "Make it easy",
      "description": "Provide direct links to the review platform and pre-filled information when possible"
    },
    {
      "icon": "Star",
      "title": "Focus on happy customers",
      "description": "Only reach out to 4 and 5-star reviewers for double-dip campaigns"
    }
  ]'::jsonb
)
WHERE slug = 'google-business/review-import';

-- Populate Google Business Bulk Updates article
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{key_features}',
      '[
        {
          "icon": "Layers",
          "title": "Bulk post creation",
          "description": "Create Google Business Profile posts and publish them to multiple locations at once. Perfect for announcing sales, events, or new products across all your locations."
        },
        {
          "icon": "MapPin",
          "title": "Location selection",
          "description": "Easily switch between locations or select multiple locations at once. The system remembers your last selected location for convenience."
        },
        {
          "icon": "Building2",
          "title": "Photo management",
          "description": "Upload photos to multiple locations simultaneously. Great for chain businesses that want to maintain consistent branding across all locations."
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "icon": "Building2",
        "title": "Connect locations",
        "description": "Connect all your Google Business Profile locations using OAuth"
      },
      {
        "number": 2,
        "icon": "MapPin",
        "title": "Select locations",
        "description": "In the Google Business dashboard, select the locations you want to update"
      },
      {
        "number": 3,
        "icon": "Layers",
        "title": "Create content",
        "description": "Create your post, upload photos, or update information"
      },
      {
        "number": 4,
        "icon": "Building2",
        "title": "Publish",
        "description": "Review your selections and publish to all chosen locations at once"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Building2",
      "title": "Maintain consistency",
      "description": "Use bulk updates to ensure all locations have the same branding and messaging"
    },
    {
      "icon": "MapPin",
      "title": "Customize when needed",
      "description": "Some updates (like location-specific events) should only go to certain locations"
    },
    {
      "icon": "Layers",
      "title": "Schedule posts strategically",
      "description": "Use bulk scheduling to plan campaigns across all locations in advance"
    }
  ]'::jsonb
)
WHERE slug = 'google-business/bulk-updates';

-- Populate Google Business Categories & Services article
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{key_features}',
      '[
        {
          "icon": "Tag",
          "title": "Primary category",
          "description": "Your main business category determines which Google Business Profile features are available and how you appear in search results. Choose the most specific category that accurately describes your core business."
        },
        {
          "icon": "List",
          "title": "Additional categories",
          "description": "Add up to 9 additional categories (10 total including primary) to describe other aspects of your business. These help you appear in more search results."
        },
        {
          "icon": "Building2",
          "title": "Services",
          "description": "Service items help customers understand exactly what you offer. Each service can include a description to provide more detail."
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "icon": "Tag",
        "title": "Select primary category",
        "description": "Choose the most specific category that describes your core business"
      },
      {
        "number": 2,
        "icon": "List",
        "title": "Add additional categories",
        "description": "Select up to 9 more categories to cover all aspects of your business"
      },
      {
        "number": 3,
        "icon": "Building2",
        "title": "Define services",
        "description": "List all services with detailed descriptions"
      },
      {
        "number": 4,
        "icon": "Tag",
        "title": "Save and verify",
        "description": "Review your selections and save to your profile"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Tag",
      "title": "Choose accurate categories",
      "description": "Incorrect categories can hurt your search ranking"
    },
    {
      "icon": "List",
      "title": "Research competitors",
      "description": "See what categories successful competitors use"
    },
    {
      "icon": "Building2",
      "title": "Be comprehensive with services",
      "description": "List all services you offer to capture more searches"
    },
    {
      "icon": "Tag",
      "title": "Use AI-generated descriptions",
      "description": "Let Prompt Reviews write professional service descriptions that include relevant keywords"
    }
  ]'::jsonb
)
WHERE slug = 'google-business/categories-services';

-- Populate Google Business Scheduling article
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{key_features}',
      '[
        {
          "icon": "Calendar",
          "title": "Booking button integration",
          "description": "Connect your existing scheduling platform (like Square, Booksy, or StyleSeat) to display a \"Book Online\" button on your Google Business Profile. When customers click it, they are taken to your scheduling system."
        },
        {
          "icon": "Clock",
          "title": "Reserve with Google",
          "description": "For eligible businesses, Reserve with Google allows customers to book appointments without leaving Google Search or Maps. This seamless integration can increase bookings significantly."
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "icon": "Calendar",
        "title": "Choose platform",
        "description": "Choose a compatible scheduling platform that integrates with Google Business Profile"
      },
      {
        "number": 2,
        "icon": "Clock",
        "title": "Set availability",
        "description": "Set up your appointment availability, services, and pricing in the scheduling platform"
      },
      {
        "number": 3,
        "icon": "Building2",
        "title": "Connect",
        "description": "Connect your scheduling platform to your Google Business Profile through the platform settings"
      },
      {
        "number": 4,
        "icon": "Calendar",
        "title": "Verify",
        "description": "Verify the \"Book Online\" button appears on your Google Business Profile"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Clock",
      "title": "Keep availability updated",
      "description": "Sync your scheduling system in real-time to avoid double bookings"
    },
    {
      "icon": "Calendar",
      "title": "Show accurate hours",
      "description": "Make sure your business hours match your booking availability"
    },
    {
      "icon": "Building2",
      "title": "Request reviews after appointments",
      "description": "Use Prompt Reviews to automatically request feedback from customers who booked through Google"
    },
    {
      "icon": "Calendar",
      "title": "Monitor booking analytics",
      "description": "Track how many customers book through Google to measure ROI"
    }
  ]'::jsonb
)
WHERE slug = 'google-business/scheduling';

-- Populate Google Business Business Info article
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{key_features}',
      '[
        {
          "icon": "Building2",
          "title": "Business name",
          "description": "Your official business name as registered. Should match your signage and legal documents. Avoid keyword stuffing or adding extra information."
        },
        {
          "icon": "MapPin",
          "title": "Address",
          "description": "Your physical business location. Must be accurate for Google Maps. For service-area businesses, you can set a service area instead of showing your address."
        },
        {
          "icon": "Phone",
          "title": "Phone number",
          "description": "Primary phone number for customer contact. Use a local number when possible. Consider using a tracking number to measure calls from Google."
        },
        {
          "icon": "Globe",
          "title": "Website",
          "description": "Your business website URL. Should link to your homepage or a landing page specific to this location."
        },
        {
          "icon": "Clock",
          "title": "Business hours",
          "description": "Regular operating hours for each day of the week. Keep these updated, especially during holidays or special events. You can set special hours for holidays."
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "icon": "Building2",
        "title": "Review current information",
        "description": "Check all your business information for accuracy"
      },
      {
        "number": 2,
        "icon": "MapPin",
        "title": "Update details",
        "description": "Make necessary changes to your business information"
      },
      {
        "number": 3,
        "icon": "Clock",
        "title": "Set business hours",
        "description": "Configure regular hours and special holiday hours"
      },
      {
        "number": 4,
        "icon": "Globe",
        "title": "Verify and save",
        "description": "Review all changes and save to your profile"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Building2",
      "title": "Keep information consistent",
      "description": "Match your NAP (Name, Address, Phone) across all online directories"
    },
    {
      "icon": "Clock",
      "title": "Update hours promptly",
      "description": "Set special hours for holidays at least 2 weeks in advance"
    },
    {
      "icon": "Phone",
      "title": "Use local phone numbers",
      "description": "Local numbers build trust and may improve local search ranking"
    },
    {
      "icon": "MapPin",
      "title": "Add service areas",
      "description": "For service-area businesses, specify all areas you serve"
    }
  ]'::jsonb
)
WHERE slug = 'google-business/business-info';

-- Populate Google Business Image Upload article
UPDATE articles
SET metadata = jsonb_set(
  jsonb_set(
    jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{key_features}',
      '[
        {
          "icon": "Star",
          "title": "Logo",
          "description": "Your business logo appears in search results and on Maps. Should be a square image, minimum 250x250 pixels. Recommended: 1024x1024 pixels, PNG or JPG format, with transparent background."
        },
        {
          "icon": "Image",
          "title": "Cover photo",
          "description": "The main banner image that appears at the top of your profile. Showcases your business atmosphere. Recommended: 1024x576 pixels (16:9 aspect ratio), horizontal orientation."
        },
        {
          "icon": "Camera",
          "title": "Additional photos",
          "description": "Showcase your products, services, team, and location. Categories include: Interior, Exterior, At Work, Team, Products, Services. Recommended: Minimum 720x720 pixels, JPG or PNG, well-lit and high quality."
        }
      ]'::jsonb
    ),
    '{how_it_works}',
    '[
      {
        "number": 1,
        "icon": "Upload",
        "title": "Upload logo and cover",
        "description": "Start by adding your logo and cover photo to establish your brand"
      },
      {
        "number": 2,
        "icon": "Camera",
        "title": "Add category photos",
        "description": "Upload images for Interior, Exterior, At Work, Team, Products, and Services"
      },
      {
        "number": 3,
        "icon": "Image",
        "title": "Organize and caption",
        "description": "Arrange photos by category and add descriptive captions"
      },
      {
        "number": 4,
        "icon": "Star",
        "title": "Review and publish",
        "description": "Check all images meet quality guidelines and publish to your profile"
      }
    ]'::jsonb
  ),
  '{best_practices}',
  '[
    {
      "icon": "Upload",
      "title": "Use professional quality",
      "description": "High-resolution, well-lit photos perform better"
    },
    {
      "icon": "Camera",
      "title": "Show variety",
      "description": "Upload photos of your location, products, team, and customers (with permission)"
    },
    {
      "icon": "Image",
      "title": "Update regularly",
      "description": "Add new photos at least monthly to keep your profile fresh"
    },
    {
      "icon": "Star",
      "title": "Follow guidelines",
      "description": "Avoid text overlays, logos, or promotional content in regular photos"
    }
  ]'::jsonb
)
WHERE slug = 'google-business/image-upload';
