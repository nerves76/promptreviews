# Bulk Business Information Updates

## Overview
The Business Information Editor allows you to update multiple Google Business Profile locations simultaneously. This guide explains how to use bulk updates effectively and what happens to fields you leave empty.

## How Bulk Updates Work

### The Golden Rule
**Empty fields are NOT updated** - Only fields with actual content are pushed to Google Business Profile.

This means:
- ✅ You can update just descriptions across multiple locations without touching other data
- ✅ You can update just hours without affecting descriptions or services
- ✅ Empty fields preserve the existing data at each location
- ❌ You CANNOT use bulk update to clear/remove existing data (leave fields empty won't delete them)

## Common Use Cases

### Update Only Descriptions
Want to update descriptions for multiple locations but keep their unique hours and services?
1. Select multiple locations
2. Enter the new description
3. Leave hours, services, and categories empty
4. Click Save - only descriptions will update

### Update Only Business Hours
Need to standardize hours across locations?
1. Select multiple locations
2. Set the business hours
3. Leave description, services, and other fields empty
4. Click Save - only hours will update

### Update Multiple Fields
Want to standardize everything?
1. Select multiple locations
2. Fill in ALL fields you want to standardize
3. Any field with content will overwrite existing data
4. Empty fields remain unchanged

## Field-by-Field Behavior

### Business Description
- **With content**: Overwrites existing description
- **Empty**: Preserves each location's current description

### Business Hours
- **With hours set**: Overwrites all existing hours
- **Not configured**: Preserves each location's current hours

### Categories
- **With selection**: Updates to new category
- **No selection**: Preserves each location's current category

### Services & Products
- **With services listed**: Replaces ALL existing services
- **Empty list**: Preserves each location's current services
- **⚠️ Warning**: Services are replaced entirely, not merged

### Address Information
- **With address**: Updates address (if allowed by Google)
- **Empty**: Preserves current address
- **Note**: Service area businesses may have hidden addresses

### Phone & Website
- **With content**: Updates contact information
- **Empty**: Preserves existing contact details

## Important Warnings

### Services Are Replaced, Not Merged
When you add services in bulk mode, they REPLACE all existing services at each location. They don't add to existing services.

**Example:**
- Location A has: "Massage Therapy, Yoga"
- Location B has: "Personal Training, Nutrition"
- You bulk add: "Wellness Coaching"
- Result: Both locations now ONLY have "Wellness Coaching"

### Cannot Clear Data via Bulk Update
You cannot use bulk update to remove/clear existing data. Empty fields are ignored, not treated as "clear this field."

To clear data from multiple locations:
1. Use single location mode for each location
2. Or use a placeholder value then manually clear later

### Address Restrictions
Some business types (service area businesses) don't display addresses publicly. The system respects these settings and won't force addresses where they shouldn't be.

## Best Practices

### 1. Test with One Location First
Before bulk updating many locations:
- Test your changes on a single location
- Verify the results in Google
- Then apply to multiple locations

### 2. Document Current State
Before making bulk changes:
- Note what's unique about each location
- Save any location-specific content you want to preserve
- Consider if bulk update is appropriate

### 3. Use Single Location Mode When Needed
For locations that need unique information:
- Switch to single location edit mode
- Load current business info
- Make specific changes
- Save individually

### 4. Review After Updates
After bulk updates:
- Check a sample of locations in Google
- Verify changes applied correctly
- Note any locations that may need individual attention

## Technical Details

### How Empty Field Detection Works
The system uses the `hasValue()` function to determine if a field should be updated:
- `null` or `undefined`: Not updated
- Empty string or whitespace only: Not updated
- Empty object `{}`: Not updated
- Empty array `[]`: Not updated
- Any other value: Will be updated

### API Behavior
When sending updates to Google Business Profile API:
1. System fetches current data for each location
2. Only includes fields with meaningful values in update payload
3. Preserves required fields (like address for certain business types)
4. Applies updates sequentially to each selected location

### Rate Limiting
Google Business Profile API has rate limits:
- Updates are processed sequentially, not in parallel
- Large bulk updates may take time to complete
- System handles rate limiting automatically

## Troubleshooting

### Changes Not Appearing
If bulk changes don't appear:
1. Check if fields were actually filled (not just focused)
2. Verify Google Business Profile connection is active
3. Check for any error messages in the UI
4. Allow 5-10 minutes for Google to process changes

### Some Locations Not Updating
Possible reasons:
- Location has different category restrictions
- Location is unverified in Google
- API rate limits temporarily blocking updates
- Location has pending edits in Google

### Unexpected Data Changes
If data changed unexpectedly:
- Remember services are REPLACED not merged
- Check if another team member made changes
- Verify you selected the correct locations
- Review what fields had content during save

## Support
For issues with bulk updates:
1. Note which locations were selected
2. Document what fields were filled
3. Check browser console for errors
4. Contact support with details