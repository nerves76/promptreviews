# Social Share Components

Production-ready components for sharing reviews on social media platforms with tracking and history.

## Components

### ShareButton
Main button component that displays share status and opens the share modal.

**Features:**
- Shows "Share" when no shares exist
- Shows share count when shares exist (e.g., "3 shares")
- Opens ShareHistoryPopover when clicked if shares exist
- Opens ShareModal directly if no shares exist
- Fully keyboard accessible

**Usage:**
```tsx
<ShareButton
  review={{
    id: "review-123",
    first_name: "John",
    last_name: "Doe",
    review_content: "Great service!",
    platform: "Google",
  }}
  shareUrl="https://example.com/reviews/123"
  productName="My Product"
  imageUrl="https://example.com/image.jpg" // Optional
  onShareSuccess={(platform) => console.log(`Shared on ${platform}`)}
  onShareError={(error) => console.error(error)}
/>
```

### ShareModal
Modal dialog for selecting platform and customizing share text.

**Features:**
- 9 platform options: Facebook, LinkedIn, X, Bluesky, Reddit, Pinterest, Email, SMS, Copy Link
- Platform-specific character limits with warnings
- Auto-generated share text based on platform
- Custom text editing mode
- Option to include/exclude reviewer name
- Image preview for platforms that support it
- Disabled state for Pinterest when no image provided

**Platforms:**
- **Facebook**: Standard share dialog
- **LinkedIn**: Professional share
- **X (Twitter)**: 280 character limit
- **Bluesky**: 300 character limit
- **Reddit**: Title + URL submission
- **Pinterest**: Requires image
- **Email**: mailto: link with subject/body
- **SMS**: Web Share API or sms: protocol
- **Copy Link**: Clipboard API with fallback

### ShareHistoryPopover
Dropdown showing past share events with timestamps.

**Features:**
- Lists all shares for a review
- Shows platform icon, name, and relative timestamp
- Delete button for each share record
- Empty state when no shares
- Click outside to close
- Escape key to close

### Toast Notifications
Simple toast system for success/error feedback.

**Features:**
- Success, error, and info types
- Auto-dismiss after 3 seconds (configurable)
- Slide-in/slide-out animations
- Multiple toasts stacked
- Manual close button

**Usage:**
```tsx
const { toasts, closeToast, success, error, info } = useToast();

// Show toast
success("Review shared successfully!");
error("Failed to share review");

// Render container
<ToastContainer toasts={toasts} onClose={closeToast} />
```

## Utilities

### shareHandlers.ts
Platform-specific share functions.

**Key Functions:**
- `handleShare(platform, data)`: Main router for all platforms
- `shareToFacebook(data)`: Opens Facebook share dialog
- `shareToLinkedIn(data)`: Opens LinkedIn share dialog
- `shareToTwitter(data)`: Opens X tweet composer
- `shareToBluesky(data)`: Opens Bluesky composer
- `shareToReddit(data)`: Opens Reddit submit page
- `shareToPinterest(data)`: Opens Pinterest pin creator
- `shareViaEmail(data)`: Opens email client
- `shareViaSMS(data)`: Uses Web Share API or SMS protocol
- `copyToClipboard(text)`: Copies to clipboard with fallback

**Configuration:**
```typescript
export const SHARE_PLATFORMS: PlatformConfig[] = [
  {
    key: 'facebook',
    name: 'Facebook',
    icon: 'FaFacebook',
    color: 'text-[#1877F2]',
  },
  // ... more platforms
];
```

### shareTextBuilder.ts
Generates platform-optimized share text.

**Key Functions:**
- `buildShareText(platform, options)`: Generates share text
- `getCharacterInfo(platform, text)`: Returns character count info
- `buildEmailSubject(productName)`: Generates email subject

**Character Limits:**
- Twitter/X: 280 chars
- Bluesky: 300 chars
- LinkedIn: 700 chars
- SMS: 160 chars
- Email: 1000 chars
- Reddit: 300 chars (title)
- Pinterest: 500 chars
- Facebook: 5000 chars (practically unlimited)

**Share Text Format:**
```
[Product Name]: ⭐⭐⭐⭐⭐
"[Review excerpt]"
[- Reviewer name] (if permitted)

via @promptreviews
[Share URL]
```

## API Integration

The components expect these API endpoints to exist:

### GET /api/review-shares?reviewId={id}
Returns share history for a review.

**Response:**
```json
{
  "shares": [
    {
      "id": "share-123",
      "platform": "twitter",
      "shared_at": "2025-10-04T12:00:00Z",
      "shared_url": "https://twitter.com/..."
    }
  ]
}
```

### POST /api/review-shares
Creates a new share record.

**Request:**
```json
{
  "reviewId": "review-123",
  "platform": "twitter",
  "sharedUrl": "https://example.com/reviews/123"
}
```

### DELETE /api/review-shares?shareId={id}
Deletes a share record.

## Styling

### Toast Animations
Added to `/src/app/globals.css`:
```css
@keyframes slide-in-right {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slide-out-right {
  from { transform: translateX(0); opacity: 1; }
  to { transform: translateX(100%); opacity: 0; }
}
```

### Design System
- Primary color: `#452F9F` (slate-blue)
- Uses Tailwind CSS for styling
- Follows HeadlessUI patterns for modals
- Fully responsive (mobile-first)
- Keyboard accessible

## Accessibility

- All buttons have `aria-label` attributes
- Modals use HeadlessUI's `Dialog` for proper focus management
- Keyboard navigation supported (Tab, Escape, Enter)
- Screen reader friendly
- Color contrast meets WCAG AA standards

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Clipboard API with fallback for older browsers
- Web Share API with fallback for SMS
- Works on mobile and desktop

## Future Enhancements

Potential improvements:
1. Add WhatsApp sharing
2. Add Instagram story sharing (requires API)
3. Generate quote card images automatically
4. Add share preview images (Open Graph)
5. Track share performance analytics
6. Add bulk sharing functionality
7. Export share history as CSV
8. Add scheduled shares

## Testing Checklist

- [ ] Share to each platform works
- [ ] Character limits are enforced
- [ ] Copy to clipboard works
- [ ] Share history displays correctly
- [ ] Delete share works
- [ ] Toast notifications appear/dismiss
- [ ] Mobile responsive
- [ ] Keyboard navigation works
- [ ] Screen reader accessible
- [ ] Error handling works
- [ ] Sample reviews don't show share button
