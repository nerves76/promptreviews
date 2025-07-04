# Location-Specific Prompt Pages Implementation Plan

## Overview

This document outlines the plan to implement location-specific prompt pages for certain tiers (primarily Maven tier), allowing businesses to create customized prompt pages for multiple locations while leveraging the existing universal prompt page framework.

## Current State Analysis

### Existing Infrastructure
- **Universal Prompt Pages**: Already implemented with `is_universal` flag in `prompt_pages` table
- **Business Profiles**: Include address fields and AI training fields (`ai_dos`, `ai_donts`)
- **Tier System**: Maven tier already mentions "Up to 10 Business Locations" in pricing
- **Database Schema**: `prompt_pages` table has comprehensive column structure
- **UI Components**: Existing universal prompt page form components can be reused

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
    
    -- Location-specific styling override (optional)
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    
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

### Business Locations Management

```typescript
// GET /api/business-locations
// - List all locations for an account
// - Include location count and tier limits

// POST /api/business-locations
// - Create new business location
// - Validate tier limits
// - Auto-create location-specific universal prompt page

// PUT /api/business-locations/[id]
// - Update business location
// - Handle cascade updates to associated prompt pages

// DELETE /api/business-locations/[id] 
// - Delete business location
// - Handle cascade deletion of associated prompt pages
// - Update account location count
```

### Enhanced Prompt Pages API

```typescript
// Modify existing endpoints to handle location context:

// GET /api/prompt-pages
// - Add location_id filter parameter
// - Return location-specific pages grouped by location

// POST /api/prompt-pages  
// - Accept business_location_id parameter
// - Validate user has access to that location
// - Inherit location-specific defaults

// GET /api/prompt-pages/[id]
// - Include business location data in response
// - Merge business profile + location data for AI context
```

## UI/UX Design

### 1. Business Locations Management Page
**Route**: `/dashboard/business-locations`

**Features**:
- List view of all business locations
- Add/edit/delete location functionality
- Location count vs tier limit indicator
- Quick actions: "Create Prompt Page", "View Pages", "Edit Location"
- Upgrade prompt for non-Maven users

**Components**:
```
- BusinessLocationsList.tsx
- BusinessLocationForm.tsx  
- LocationCard.tsx
- LocationLimitAlert.tsx
```

### 2. Enhanced Universal Prompt Pages

**Route**: `/dashboard/edit-prompt-page/location/[locationId]`

**Features**:
- Location-specific universal prompt page editing
- Inherit from business profile with location overrides
- Location context displayed prominently
- Breadcrumb navigation: Account > Locations > [Location Name] > Universal Page

**Form Sections**:
1. **Location Information** (read-only display)
   - Location name, address, contact info
2. **Location-Specific Training** 
   - Business description for this location
   - Unique aspects of this location
   - Location-specific AI dos/don'ts
3. **Standard Universal Page Fields**
   - Review platforms (with location defaults)
   - Offer configuration
   - Emoji sentiment
   - Falling animations

### 3. Prompt Pages List Enhancement

**Route**: `/prompt-pages`

**Features**:
- Location filter dropdown (for Maven tier)
- Visual grouping by location
- Location-specific universal pages prominently displayed
- Clear indication of which pages belong to which location

### 4. Location Selector for New Prompt Pages

**Enhancement to existing prompt page creation**:
- Location selector for Maven tier users
- Default to main business if no location selected
- Location context passed through to form pre-filling

## Component Architecture

### 1. Location Context Provider

```typescript
// LocationContextProvider.tsx
interface LocationContext {
  locations: BusinessLocation[];
  currentLocation: BusinessLocation | null;
  setCurrentLocation: (location: BusinessLocation | null) => void;
  canCreateLocation: boolean;
  locationLimit: number;
}
```

### 2. Reusable Location Form Components

```typescript
// LocationBasicInfoForm.tsx
// LocationAddressForm.tsx  
// LocationAITrainingForm.tsx
// LocationContactForm.tsx
```

### 3. Enhanced Prompt Page Components

```typescript
// Modify existing UniversalPromptPageForm.tsx to accept location context
// Add LocationPromptPageForm.tsx that wraps universal form with location data
// Update PromptPageForm.tsx to handle location context
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

## Migration Strategy

### Phase 1: Database Setup
1. Create `business_locations` table
2. Add location reference to `prompt_pages`
3. Update account tier limits
4. Create necessary indexes and constraints

### Phase 2: Core API Development
1. Business locations CRUD endpoints
2. Enhanced prompt pages API with location context
3. Location-aware data fetching utilities

### Phase 3: UI Components
1. Business locations management interface
2. Location-specific prompt page forms
3. Enhanced navigation and filtering

### Phase 4: Integration & Testing
1. Location context throughout the application
2. Tier enforcement and permission checks
3. Data migration for existing accounts

### Phase 5: Advanced Features
1. Location-specific analytics
2. Bulk operations across locations
3. Location templates and cloning

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

## Implementation Timeline

### Sprint 1 (2 weeks): Foundation
- Database schema implementation
- Basic location CRUD APIs
- Location model and TypeScript interfaces

### Sprint 2 (2 weeks): Core UI
- Business locations management page
- Location creation and editing forms
- Basic location listing and navigation

### Sprint 3 (2 weeks): Prompt Page Integration
- Location-specific universal prompt pages
- Enhanced prompt page creation flow
- Location context in existing components

### Sprint 4 (1 week): Permissions & Limits
- Tier enforcement implementation
- Location limit validation
- Permission checks throughout UI

### Sprint 5 (1 week): Testing & Polish
- Comprehensive testing of location features
- UI/UX refinements based on feedback
- Data migration for existing accounts

### Sprint 6 (1 week): Documentation & Launch
- User documentation updates
- Feature announcement preparation
- Monitoring and analytics setup

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