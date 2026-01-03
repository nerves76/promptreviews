-- Add 4 new competitors: SOCi, Local Falcon, Localo, Local Dominator

-- Get max display_order and insert competitors
DO $$
DECLARE
    max_order INT;
    soci_id UUID;
    local_falcon_id UUID;
    localo_id UUID;
    local_dominator_id UUID;
BEGIN
    SELECT COALESCE(MAX(display_order), 0) INTO max_order FROM competitors;

    -- Insert SOCi
    INSERT INTO competitors (name, slug, logo_url, website_url, description, status, display_order, created_at, updated_at)
    VALUES (
        'SOCi',
        'soci',
        '/images/pr-competitors/soci-icon.png',
        'https://www.soci.ai/',
        'SOCi is an AI-powered marketing platform founded in 2012 that automates local marketing workflows for multi-location enterprises. Their suite includes tools for reputation management, local SEO, social media, and customer engagement, targeting franchise brands, retail chains, and healthcare organizations.',
        'active',
        max_order + 1,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        website_url = EXCLUDED.website_url,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO soci_id;

    -- Insert Local Falcon
    INSERT INTO competitors (name, slug, logo_url, website_url, description, status, display_order, created_at, updated_at)
    VALUES (
        'Local Falcon',
        'local-falcon',
        '/images/pr-competitors/localfalcon-icon.png',
        'https://www.localfalcon.com/',
        'Local Falcon is a local rank tracking platform that helps businesses monitor their visibility in Google Maps and local search results. Known for their geo-grid rank tracking technology, they serve agencies and local businesses who need to track rankings across specific geographic areas.',
        'active',
        max_order + 2,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        website_url = EXCLUDED.website_url,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO local_falcon_id;

    -- Insert Localo
    INSERT INTO competitors (name, slug, logo_url, website_url, description, status, display_order, created_at, updated_at)
    VALUES (
        'Localo',
        'localo',
        '/images/pr-competitors/localo-icon.png',
        'https://localo.com/',
        'Localo is a local SEO software platform that automates tasks to help businesses improve their Google Business Profile visibility. Their tools include rank tracking, review management, content publishing, and AI-powered optimization, serving business owners and digital agencies.',
        'active',
        max_order + 3,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        website_url = EXCLUDED.website_url,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO localo_id;

    -- Insert Local Dominator
    INSERT INTO competitors (name, slug, logo_url, website_url, description, status, display_order, created_at, updated_at)
    VALUES (
        'Local Dominator',
        'local-dominator',
        '/images/pr-competitors/localdominator-icon.png',
        'https://localdominator.co/',
        'Local Dominator is a SaaS platform specializing in Google Maps rank tracking and local SEO management. They offer geo-grid rank tracking, GBP management, and white-labeled reporting, targeting digital agencies and multi-location enterprises seeking affordable local SEO solutions.',
        'active',
        max_order + 4,
        NOW(),
        NOW()
    )
    ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        logo_url = EXCLUDED.logo_url,
        website_url = EXCLUDED.website_url,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO local_dominator_id;

    -- Insert SOCi features
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited, notes)
    SELECT 
        soci_id,
        cf.id,
        CASE cf.slug
            WHEN 'free-trial' THEN true
            WHEN 'analytics-dashboard' THEN true
            WHEN 'review-monitoring' THEN true
            WHEN 'sms-review-requests' THEN true
            WHEN 'gbp-integration' THEN true
            WHEN 'crm-integrations' THEN true
            WHEN 'review-response' THEN true
            WHEN 'pos-integrations' THEN true
            WHEN 'email-review-requests' THEN true
            WHEN 'no-contracts' THEN false
            WHEN 'sentiment-analysis' THEN true
            WHEN 'gbp-posting' THEN true
            WHEN 'local-rank-tracking' THEN true
            WHEN 'competitor-benchmarking' THEN true
            WHEN 'zapier' THEN true
            WHEN 'transparent-pricing' THEN false
            WHEN 'ai-responses' THEN true
            WHEN 'qr-codes' THEN true
            WHEN 'citation-management' THEN true
            WHEN 'review-automation' THEN true
            WHEN 'negative-alerts' THEN true
            WHEN 'api-access' THEN true
            WHEN 'custom-reports' THEN true
            WHEN 'smb-affordable' THEN false
            WHEN 'listing-sync' THEN true
            WHEN 'review-widgets' THEN true
            WHEN 'custom-landing-pages' THEN true
            WHEN 'webhooks' THEN true
            WHEN 'unlimited-review-requests' THEN true
            WHEN 'white-label-reports' THEN true
            WHEN 'unlimited-users' THEN true
            WHEN 'social-sharing' THEN true
            WHEN 'multi-platform-requests' THEN true
            WHEN 'review-filtering' THEN true
            WHEN 'review-reports' THEN true
            WHEN 'nfc-tap-reviews' THEN false
            ELSE false
        END,
        CASE cf.slug WHEN 'local-rank-tracking' THEN true ELSE false END,
        CASE cf.slug
            WHEN 'transparent-pricing' THEN 'Custom enterprise pricing only'
            WHEN 'no-contracts' THEN 'Enterprise contracts required'
            WHEN 'smb-affordable' THEN 'Enterprise-focused, high minimum spend'
            WHEN 'local-rank-tracking' THEN 'Basic tracking, not geo-grid focused'
            ELSE NULL
        END
    FROM comparison_features cf
    ON CONFLICT (competitor_id, feature_id) DO NOTHING;

    -- Insert Local Falcon features
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited, notes)
    SELECT 
        local_falcon_id,
        cf.id,
        CASE cf.slug
            WHEN 'free-trial' THEN true
            WHEN 'analytics-dashboard' THEN true
            WHEN 'review-monitoring' THEN false
            WHEN 'sms-review-requests' THEN false
            WHEN 'gbp-integration' THEN true
            WHEN 'crm-integrations' THEN false
            WHEN 'review-response' THEN false
            WHEN 'pos-integrations' THEN false
            WHEN 'email-review-requests' THEN false
            WHEN 'no-contracts' THEN true
            WHEN 'sentiment-analysis' THEN false
            WHEN 'gbp-posting' THEN true
            WHEN 'local-rank-tracking' THEN true
            WHEN 'competitor-benchmarking' THEN true
            WHEN 'zapier' THEN true
            WHEN 'transparent-pricing' THEN true
            WHEN 'ai-responses' THEN false
            WHEN 'qr-codes' THEN false
            WHEN 'citation-management' THEN false
            WHEN 'review-automation' THEN false
            WHEN 'negative-alerts' THEN false
            WHEN 'api-access' THEN true
            WHEN 'custom-reports' THEN true
            WHEN 'smb-affordable' THEN true
            WHEN 'listing-sync' THEN false
            WHEN 'review-widgets' THEN false
            WHEN 'custom-landing-pages' THEN false
            WHEN 'webhooks' THEN true
            WHEN 'unlimited-review-requests' THEN false
            WHEN 'white-label-reports' THEN true
            WHEN 'unlimited-users' THEN true
            WHEN 'social-sharing' THEN false
            WHEN 'multi-platform-requests' THEN false
            WHEN 'review-filtering' THEN false
            WHEN 'review-reports' THEN false
            WHEN 'nfc-tap-reviews' THEN false
            ELSE false
        END,
        CASE cf.slug WHEN 'zapier' THEN true WHEN 'unlimited-users' THEN true ELSE false END,
        CASE cf.slug
            WHEN 'local-rank-tracking' THEN 'Industry-leading geo-grid tracking'
            WHEN 'gbp-integration' THEN 'Read-only for rank tracking'
            WHEN 'review-monitoring' THEN 'Not a review management platform'
            WHEN 'unlimited-users' THEN 'Varies by plan'
            ELSE NULL
        END
    FROM comparison_features cf
    ON CONFLICT (competitor_id, feature_id) DO NOTHING;

    -- Insert Localo features
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited, notes)
    SELECT 
        localo_id,
        cf.id,
        CASE cf.slug
            WHEN 'free-trial' THEN true
            WHEN 'analytics-dashboard' THEN true
            WHEN 'review-monitoring' THEN true
            WHEN 'sms-review-requests' THEN false
            WHEN 'gbp-integration' THEN true
            WHEN 'crm-integrations' THEN true
            WHEN 'review-response' THEN true
            WHEN 'pos-integrations' THEN false
            WHEN 'email-review-requests' THEN true
            WHEN 'no-contracts' THEN true
            WHEN 'sentiment-analysis' THEN true
            WHEN 'gbp-posting' THEN true
            WHEN 'local-rank-tracking' THEN true
            WHEN 'competitor-benchmarking' THEN true
            WHEN 'zapier' THEN false
            WHEN 'transparent-pricing' THEN true
            WHEN 'ai-responses' THEN true
            WHEN 'qr-codes' THEN true
            WHEN 'citation-management' THEN false
            WHEN 'review-automation' THEN true
            WHEN 'negative-alerts' THEN true
            WHEN 'api-access' THEN false
            WHEN 'custom-reports' THEN true
            WHEN 'smb-affordable' THEN true
            WHEN 'listing-sync' THEN false
            WHEN 'review-widgets' THEN true
            WHEN 'custom-landing-pages' THEN true
            WHEN 'webhooks' THEN false
            WHEN 'unlimited-review-requests' THEN false
            WHEN 'white-label-reports' THEN true
            WHEN 'unlimited-users' THEN false
            WHEN 'social-sharing' THEN false
            WHEN 'multi-platform-requests' THEN false
            WHEN 'review-filtering' THEN true
            WHEN 'review-reports' THEN true
            WHEN 'nfc-tap-reviews' THEN false
            ELSE false
        END,
        CASE cf.slug WHEN 'crm-integrations' THEN true WHEN 'sentiment-analysis' THEN true WHEN 'review-automation' THEN true ELSE false END,
        CASE cf.slug
            WHEN 'free-trial' THEN 'Free plan available with limits'
            WHEN 'crm-integrations' THEN 'Limited integrations'
            WHEN 'sentiment-analysis' THEN 'Basic sentiment analysis'
            WHEN 'sms-review-requests' THEN 'Not available'
            ELSE NULL
        END
    FROM comparison_features cf
    ON CONFLICT (competitor_id, feature_id) DO NOTHING;

    -- Insert Local Dominator features
    INSERT INTO competitor_features (competitor_id, feature_id, has_feature, is_limited, notes)
    SELECT 
        local_dominator_id,
        cf.id,
        CASE cf.slug
            WHEN 'free-trial' THEN true
            WHEN 'analytics-dashboard' THEN true
            WHEN 'review-monitoring' THEN true
            WHEN 'sms-review-requests' THEN false
            WHEN 'gbp-integration' THEN true
            WHEN 'crm-integrations' THEN false
            WHEN 'review-response' THEN true
            WHEN 'pos-integrations' THEN false
            WHEN 'email-review-requests' THEN false
            WHEN 'no-contracts' THEN true
            WHEN 'sentiment-analysis' THEN false
            WHEN 'gbp-posting' THEN true
            WHEN 'local-rank-tracking' THEN true
            WHEN 'competitor-benchmarking' THEN true
            WHEN 'zapier' THEN false
            WHEN 'transparent-pricing' THEN true
            WHEN 'ai-responses' THEN false
            WHEN 'qr-codes' THEN false
            WHEN 'citation-management' THEN true
            WHEN 'review-automation' THEN false
            WHEN 'negative-alerts' THEN true
            WHEN 'api-access' THEN true
            WHEN 'custom-reports' THEN true
            WHEN 'smb-affordable' THEN true
            WHEN 'listing-sync' THEN false
            WHEN 'review-widgets' THEN false
            WHEN 'custom-landing-pages' THEN false
            WHEN 'webhooks' THEN false
            WHEN 'unlimited-review-requests' THEN false
            WHEN 'white-label-reports' THEN true
            WHEN 'unlimited-users' THEN true
            WHEN 'social-sharing' THEN false
            WHEN 'multi-platform-requests' THEN false
            WHEN 'review-filtering' THEN false
            WHEN 'review-reports' THEN true
            WHEN 'nfc-tap-reviews' THEN false
            ELSE false
        END,
        CASE cf.slug WHEN 'unlimited-users' THEN true ELSE false END,
        CASE cf.slug
            WHEN 'local-rank-tracking' THEN 'Geo-grid tracking core feature'
            WHEN 'citation-management' THEN 'Citations builder included'
            WHEN 'unlimited-users' THEN 'Varies by plan'
            WHEN 'smb-affordable' THEN 'Starts at $49/month'
            ELSE NULL
        END
    FROM comparison_features cf
    ON CONFLICT (competitor_id, feature_id) DO NOTHING;

END $$;
