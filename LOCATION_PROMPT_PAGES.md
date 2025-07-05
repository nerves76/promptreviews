# Location-Specific Prompt Pages Implementation Plan

## Overview

This document outlines the plan to implement location-specific prompt pages for certain tiers (primarily Maven tier), allowing businesses to create customized prompt pages for multiple locations while leveraging the existing universal prompt page framework.

## Key Design Decision: Integrated Approach

**✅ Chosen Strategy**: Integrate location prompt pages into the existing `/prompt-pages` view as a new table section between the universal page and custom prompt pages in the table below. Location pages need to be identified by their location name and they don't need statuses like the custom prompt pages have. We should probably paginate the business prompt pages after 6-8 are listed.

**Benefits**:
- **Reuses all existing features** - Same prompt page functionality, just different business context
- **Familiar UX pattern** - Follows existing universal + custom pages structure  
- **Faster implementation** - 5.5 weeks vs. 8 weeks for separate page approach
- **Lower complexity** - Enhances existing components rather than building new systems
- **Single source of truth** - All prompt pages visible in one place

## Current State Analysis

### Existing Infrastructure
- **Universal Prompt Pages**: Already implemented with `is_universal` flag in `prompt_pages` table
- **Business Profiles**: Include address fields and AI training fields (`ai_dos`, `ai_donts`)
- **Tier System**: Maven tier already mentions "Up to 10 Business Locations" in pricing
- **Database Schema**: `prompt_pages` table has comprehensive column structure
- **UI Components**: Existing form components should be reused. 

### Tier Configuration
- **Grower**: Universal prompt page only (no location-specific pages)
- **Builder**: Universal prompt page only (no location-specific pages)  
- **Maven**: Up to 10 business locations with location-specific prompt pages

## Database Schema Changes

### 1. New Table: `business_locations`

```sql
CREATE TABLE business_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., "Downtown Seattle Location"
    business_name TEXT, -- e.g., "Acme Dental - Downtown"
    
    -- Address Information
    address_street TEXT,
    address_city TEXT,
    address_state TEXT,
    address_zip TEXT,
    address_country TEXT,
    
    -- Location-Specific Business Details
    business_description TEXT, -- New field for location-specific description
    unique_aspects TEXT, -- New field for what makes this location unique
    phone TEXT,
    email TEXT,
    website_url TEXT,
    
    -- AI Training Fields (location-specific)
    ai_dos TEXT, -- Location-specific AI dos
    ai_donts TEXT, -- Location-specific AI don'ts
    
    -- Location-specific review platforms override
    review_platforms JSONB,
    
    -- Location-specific styling override
    logo_url TEXT,
    (The product page already has this feature to add a unique featured photo, instead of using logo, same thing here)

    
    -- Metadata
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_business_locations_account_id ON business_locations(account_id);
CREATE INDEX idx_business_locations_active ON business_locations(account_id, is_active);
```

### 2. Update `prompt_pages` table

```sql
-- Add location reference to prompt_pages
ALTER TABLE prompt_pages 
ADD COLUMN business_location_id UUID REFERENCES business_locations(id) ON DELETE CASCADE;

-- Add index for location-based queries
CREATE INDEX idx_prompt_pages_location ON prompt_pages(business_location_id);

-- Add constraint to ensure logical consistency
-- Either is_universal=true OR business_location_id is not null (but not both)
ALTER TABLE prompt_pages 
ADD CONSTRAINT check_universal_or_location 
CHECK (
    (is_universal = true AND business_location_id IS NULL) OR 
    (is_universal = false AND business_location_id IS NOT NULL) OR
    (is_universal = false AND business_location_id IS NULL)
);
```

### 3. Account-level location limits

```sql
-- Add location count tracking to accounts table
ALTER TABLE accounts 
ADD COLUMN location_count INTEGER DEFAULT 0,
ADD COLUMN max_locations INTEGER DEFAULT 0;

-- Update existing accounts based on plan
UPDATE accounts 
SET max_locations = CASE 
    WHEN plan = 'maven' THEN 10
    WHEN plan = 'builder' THEN 0
    WHEN plan = 'grower' THEN 0
    ELSE 0
END;
```

## API Endpoints

### Minimal New API Requirements

```typescript
// GET /api/business-locations
// - List all locations for an account (used in location selector)
// - Include location count and tier limits
// - Lightweight endpoint for location metadata

// POST /api/business-locations
// - Create new business location with validation
// - Auto-create location-specific universal prompt page
// - Return created location for immediate UI update

// PUT /api/business-locations/[id]
// - Update business location details
// - Cascade updates to associated prompt page context

// DELETE /api/business-locations/[id] 
// - Delete location and associated prompt page
// - Update account location count
```

### Enhanced Existing APIs (Minimal Changes)

```typescript
// Leverage existing prompt pages API with location context:

// GET /api/prompt-pages (existing, enhanced)
// - Add ?include_locations=true parameter 
// - Return location prompt pages in same structure
// - Group by type: universal, location-universal, custom

// POST /api/prompt-pages (existing, enhanced)
// - Accept optional business_location_id parameter
// - Use existing validation and creation logic
// - Inherit location context for data pre-filling

// PUT /api/prompt-pages/[id] (existing, works as-is)
// - No changes needed - location context handled in data layer
// - Same save logic, enhanced data inheritance

// GET /api/prompt-pages/[id] (existing, enhanced)
// - Include location context in response when applicable
// - Merge location + business profile for AI generation
// - Same response structure, enriched data
```

## UI/UX Design

### 1. Enhanced Prompt Pages List (Integrated Approach)

**Route**: `/prompt-pages` (existing page, enhanced)

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ Universal Prompt Page (Account-wide)     │ ← Existing
│ [Edit] [View] [QR Code]                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐ ← New section (Maven only)
│ Location Prompt Pages                   │
│ ┌─────────────────┬─────────────────────┐│
│ │ Downtown Store  │ [Edit] [View] [QR]  ││
│ │ 123 Main St     │ universal-downtown  ││
│ ├─────────────────┼─────────────────────┤│
│ │ Mall Location   │ [Edit] [View] [QR]  ││
│ │ 456 Mall Blvd   │ universal-mall      ││
│ ├─────────────────┼─────────────────────┤│
│ │ + Add Location  │                     ││
│ └─────────────────┴─────────────────────┘│
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Custom Prompt Pages                     │ ← Existing  
│ [Existing table with customer pages]    │
└─────────────────────────────────────────┘
```

**Features**:
- **Reuse existing universal prompt page card design** for location pages
- **Same action buttons** as custom pages (Edit, View, QR Code)
- **Inline location management** - Add/edit directly in the table
- **Tier-based visibility** - Location section only shows for Maven tier
- **Location limit indicator** - "2/10 locations" in section header
- **Quick upgrade prompt** for non-Maven users

### 2. Location Management (Modal/Inline)

**Modal for location creation/editing**:
- **Location Basic Info**: Name, business name, address
- **Location-Specific Details**: Business description, unique aspects
- **AI Training**: Location-specific AI dos/don'ts
- **Contact Info**: Phone, email, website (optional overrides)

**Benefits of modal approach**:
- No new routes needed
- Reuses existing modal patterns
- Keeps user on main prompt pages view
- Familiar UX pattern

### 3. Location-Specific Prompt Page Editing

**Route**: `/dashboard/edit-prompt-page/location/[locationId]`

**Features**:
- **Identical to existing universal prompt page** - but with additions. Might be good to use the 2 step setup that is used for service prompt pages to accomidate for content.
Location information can be exactly same as it is for Your Business (Name address, phone etc)
Unique Location Information for AI
Oh we could add Services section from Service Prompt Pages
AI Dos and AI DOn'ts also on Services and Your Business pages
- Offer banner
  - Review platforms (inherits from location settings)
  - Offer configuration
  - Emoji sentiment
  - Falling animations
  - AI button settings

**Data Inheritance**:
1. Location-specific settings (address, AI training, etc.)
2. Account business profile defaults
3. Same fallback logic as current universal page

### 4. Custom Prompt Page Enhancement

**Minimal changes to existing prompt page creation**:
- **Location selector** for Maven tier users (optional)
- **Default to account-wide** if no location selected
- **Pre-fill location context** when location is selected
- **Same form, same features** - just different business context

## Component Architecture

### 1. Enhanced Existing Components (Minimal Changes)

```typescript
// PromptPagesTable.tsx - Add location section
// - New locationPromptPages prop
// - Location table section for Maven tier
// - Reuse existing table row components

// UniversalPromptPageForm.tsx - Accept location context
// - Add optional locationData prop
// - Same form fields, different data source
// - Location context banner component

// PromptPageForm.tsx - Optional location selector
// - Add location selector for Maven tier
// - Pre-fill with location context when selected
// - Same form logic, enhanced data inheritance
```

### 2. New Location Components (Minimal Set)

```typescript
// LocationPromptPagesSection.tsx
// - Table section for location prompt pages
// - Add location button and modal trigger
// - Reuses existing table styling and actions

// LocationModal.tsx  
// - Modal for location creation/editing
// - Simple form with location-specific fields
// - Reuses existing modal components

// LocationContextBanner.tsx
// - Display location context in prompt page editor
// - Shows location name, address summary
// - Breadcrumb navigation
```

### 3. Data Integration (Leverage Existing Patterns)

```typescript
// Extend existing data fetching utilities
// - Add location context to prompt page queries
// - Merge location + business profile data
// - Same inheritance pattern as current universal pages

// Reuse existing form state management
// - Same form validation logic
// - Same save/publish workflows  
// - Enhanced with location context where needed
```

## Data Flow & Business Logic

### 1. Location-Specific Data Inheritance

**Priority Order (highest to lowest)**:
1. Location-specific prompt page overrides
2. Location-specific business settings  
3. Account-level business profile defaults

**Example for AI generation**:
```typescript
function getEffectiveAIDos(promptPage, location, businessProfile) {
    return promptPage.ai_dos || 
           location.ai_dos || 
           businessProfile.ai_dos || 
           '';
}
```

### 2. Automatic Universal Page Creation

When a new business location is created:
1. Auto-create a location-specific universal prompt page
2. Inherit settings from account's main universal page
3. Apply location-specific overrides (address, contact info)
4. Generate location-specific slug pattern: `universal-{location-slug}`

### 3. Location-Specific URL Generation

```typescript
// URL patterns:
// Universal pages: /r/{account-universal-slug}
// Location universal pages: /r/{location-universal-slug}  
// Location custom pages: /r/{custom-page-slug}

// Slug generation examples:
// "Acme Dental Downtown" -> "acme-dental-downtown"
// Universal page: "acme-dental-downtown-universal"
```

## Tier Enforcement & Permissions

### 1. Location Creation Limits

```typescript
// Middleware: checkLocationLimit
function canCreateLocation(account) {
    const maxLocations = getTierLocationLimit(account.plan);
    return account.location_count < maxLocations;
}

function getTierLocationLimit(plan) {
    switch(plan) {
        case 'maven': return 10;
        case 'builder': return 0;
        case 'grower': return 0;
        default: return 0;
    }
}
```

### 2. Feature Access Control

```typescript
// Component: LocationFeatureGate.tsx
function LocationFeatureGate({ userPlan, children, fallback }) {
    const hasLocationAccess = ['maven'].includes(userPlan);
    return hasLocationAccess ? children : fallback;
}
```

### 3. Database Constraints

```sql
-- Trigger to enforce location limits
CREATE OR REPLACE FUNCTION check_location_limit()
RETURNS TRIGGER AS $$
BEGIN
    DECLARE
        current_count INTEGER;
        max_allowed INTEGER;
    BEGIN
        SELECT location_count, max_locations INTO current_count, max_allowed
        FROM accounts WHERE id = NEW.account_id;
        
        IF current_count >= max_allowed THEN
            RAISE EXCEPTION 'Location limit exceeded for this account tier';
        END IF;
        
        RETURN NEW;
    END;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_location_limit
    BEFORE INSERT ON business_locations
    FOR EACH ROW EXECUTE FUNCTION check_location_limit();
```

## Migration Strategy (Streamlined)

### Phase 1: Foundation (Week 1)
1. Create `business_locations` table and constraints
2. Add location reference to `prompt_pages` table  
3. Update account tier limits and location counts
4. Basic location CRUD API endpoints

### Phase 2: Integration (Weeks 2-3)
1. Enhance existing `/prompt-pages` with location section
2. Location modal and basic table components
3. Location context in universal prompt page forms
4. Data inheritance logic (location → business profile)

### Phase 3: Polish & Launch (Weeks 4-5.5)
1. Tier enforcement and permission system
2. UI refinements and comprehensive testing
3. Data migration for existing Maven accounts
4. Documentation and feature launch

### Simplified Benefits
- **Incremental enhancement** of existing features vs. building new systems
- **Lower risk** - existing functionality remains unchanged
- **Faster delivery** - 5.5 weeks vs. 8 weeks
- **Familiar UX** - users don't need to learn new navigation patterns

## Data Migration Plan

### Existing Maven Accounts
```sql
-- For Maven tier accounts that may already have multiple "locations"
-- in their business description, we can:

-- 1. Create a default "Main Location" for all Maven accounts
INSERT INTO business_locations (account_id, name, business_name, address_street, address_city, address_state, address_zip, address_country, ai_dos, ai_donts)
SELECT 
    b.account_id,
    'Main Location' as name,
    b.name as business_name,
    b.address_street,
    b.address_city, 
    b.address_state,
    b.address_zip,
    b.address_country,
    b.ai_dos,
    b.ai_donts
FROM businesses b
JOIN accounts a ON b.account_id = a.id  
WHERE a.plan = 'maven';

-- 2. Update account location counts
UPDATE accounts 
SET location_count = 1 
WHERE plan = 'maven';
```

## Security Considerations

### 1. Access Control
- Users can only access locations within their account
- Location-specific prompt pages inherit account permissions
- API endpoints validate location ownership before operations

### 2. Data Isolation
- All location queries filtered by account_id
- Prompt pages linked to locations must belong to same account
- No cross-account location access possible

### 3. Input Validation
- Location names must be unique within account
- Address validation for geocoding (future feature)
- AI training fields sanitized to prevent injection

## Performance Considerations

### 1. Database Optimization
- Indexes on frequently queried fields (account_id, location_id)
- Efficient joins between locations and prompt_pages
- Consider materialized views for location summaries

### 2. Caching Strategy
- Cache location lists per account
- Cache location-specific business data for AI generation
- Invalidate cache on location updates

### 3. Query Optimization
- Eager load location data with prompt pages
- Batch operations for multi-location updates
- Limit location queries to active locations only

## Analytics & Reporting

### Location-Specific Metrics
- Prompt page performance by location
- Review submission rates per location
- Location-specific conversion tracking
- Geographic performance analysis

### Enhanced Dashboard
- Location performance comparison
- Multi-location summary views  
- Location-specific goal tracking
- Cross-location benchmarking

## Future Enhancement Opportunities

### 1. Location Templates
- Save location configurations as templates
- Quick setup for franchise/chain businesses
- Template marketplace for common business types

### 2. Geographic Features
- Map view of business locations
- Location-based customer routing
- Geofenced prompt page delivery

### 3. Advanced Multi-Location Features
- Cross-location customer management
- Location-specific staff assignment
- Chain-wide reporting and analytics

### 4. Franchise/Enterprise Features
- Location groups and hierarchies
- Corporate-level settings inheritance
- Location manager roles and permissions

## Implementation Timeline (Simplified)

### Sprint 1 (1 week): Database & API Foundation
- Database schema implementation (`business_locations` table)
- Basic location CRUD APIs (`/api/business-locations`)
- Location model and TypeScript interfaces
- Account tier limit updates

### Sprint 2 (1.5 weeks): Core Integration  
- Enhance existing `/prompt-pages` with location section
- Location modal for creation/editing
- Basic location table component (reusing existing patterns)
- Auto-creation of location universal prompt pages

### Sprint 3 (1.5 weeks): Prompt Page Enhancement
- Add location context to existing universal prompt page form
- Location selector in custom prompt page creation
- Enhanced data inheritance (location → business profile)
- Location context banner in prompt page editor

### Sprint 4 (1 week): Tier Enforcement & Polish
- Tier enforcement implementation (Maven only)
- Location limit validation and UI indicators
- Permission checks and upgrade prompts
- UI refinements and testing

### Sprint 5 (0.5 weeks): Migration & Launch
- Data migration for existing Maven accounts
- Documentation updates
- Feature launch preparation

**Total: 5.5 weeks** (vs. original 8 weeks)

### Why It's Faster
- **Reusing existing components** instead of building from scratch
- **Integrated UI approach** eliminates need for separate pages
- **Leveraging existing APIs** with minimal enhancements
- **Same prompt page features** - just different data context
- **Familiar patterns** throughout the implementation

## Success Metrics

### Technical Metrics
- Database query performance (< 100ms for location queries)
- Zero downtime deployment of schema changes
- < 1% error rate on location operations

### Business Metrics
- Maven tier adoption increase
- Location feature usage rates
- Customer satisfaction with multi-location workflow
- Support ticket reduction for location management

### User Experience Metrics
- Location setup completion rate
- Time to create first location-specific page
- User retention after location feature adoption

---

This plan provides a comprehensive roadmap for implementing location-specific prompt pages while leveraging your existing universal prompt page infrastructure and maintaining consistency with your current architecture patterns.