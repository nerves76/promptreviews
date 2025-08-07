# 🎮 Get Found Online: The Game - Marketing Embed Guide

## Quick Start

"Get Found Online: The Game" is ready to embed on any marketing website! Here are the easiest ways to add it:

## 🚀 Option 1: Direct Game Embed (Recommended)

Add this to any webpage to embed the game directly:

```html
<!-- Add this to your <head> -->
<script src="https://app.promptreviews.app/prompty-power-game/game-embed.js"></script>

<!-- Add this wherever you want the game to appear -->
<div data-prompty-game data-prompty-direct></div>
```

That's it! The game will appear directly on your page.

## 🎯 Option 2: Game Button (Opens Modal)

```html
<!-- Add this to your <head> -->
<script src="https://app.promptreviews.app/prompty-power-game/game-embed.js"></script>

<!-- Add this wherever you want the game button -->
<div data-prompty-game></div>
```

This creates a beautiful button that opens the game in a modal.

## 🎮 Option 3: Custom Button

```html
<script src="https://app.promptreviews.app/prompty-power-game/game-embed.js"></script>

<button onclick="openPromptyGame()" class="your-custom-style">
    🎮 Play Get Found Online: The Game!
</button>
```

## 📦 Option 4: Simple iframe (No Script Needed)

```html
<iframe 
    src="https://app.promptreviews.app/prompty-power-game/index.html" 
    width="1120" 
    height="760" 
    frameborder="0"
    title="Get Found Online: The Game">
</iframe>
```

## 🎨 Option 4: Landing Page Integration

```html
<div id="game-section">
    <h2>See How Review Management Works</h2>
    <p>Play our interactive game to experience how Prompt Reviews helps you turn difficult customers into 5-star reviewers!</p>
    <div data-prompty-game></div>
</div>

<script src="https://promptreviews.app/prompty-power-game/game-embed.js"></script>
```

## 📊 Marketing Benefits

### Lead Generation
- Add email capture for high score saving
- Track engagement metrics
- Convert players to trial users

### Brand Awareness
- Interactive demonstration of your platform
- Memorable brand experience
- Social sharing potential

### Educational Marketing
- Shows your product value through gameplay
- Demonstrates problem-solving approach
- Builds trust through transparency

## 🛠️ Customization Options

### Custom Button Text
```javascript
embedPromptyGame('#my-container', {
    buttonText: 'Play Get Found Online: The Game!',
    modalTitle: 'Experience Our Platform'
});
```

### Custom Styling
```css
.prompty-game-embed-btn {
    background: your-brand-color !important;
    /* Your custom styles */
}
```

## 📈 Analytics Integration

The embed automatically tracks:
- Game opens
- Score milestones
- Play time
- Completion rates

### Google Analytics Example
```javascript
// Add this after the embed script
gtag('event', 'game_interaction', {
    event_category: 'Engagement',
    event_label: 'Get Found Online: The Game'
});
```

## 🎮 Game Features for Marketing

### Educational Elements
- **Authority Score**: Teaches reputation building
- **Customer Conversion**: Shows review management process
- **Boss Battles**: Demonstrates handling difficult customers
- **Power-ups**: Represents business growth tools

### Built-in CTAs
- Marketing header with value proposition
- Footer with clear call-to-action buttons
- Game over screen with conversion messaging
- Links to your main platform

## 📱 Mobile Responsive

The game automatically adapts to:
- Desktop computers
- Tablets
- Mobile phones
- Different screen orientations

## 🔧 Technical Requirements

### Browser Support
- Chrome, Firefox, Safari, Edge
- Works on iOS and Android
- No plugins required
- Canvas and JavaScript support

### Performance
- Loads in under 3 seconds
- 60 FPS gameplay
- Optimized images and scripts
- CDN-ready assets

## 🎯 Best Practices

### Placement Ideas
1. **Hero Section**: Major impact, high visibility
2. **Product Demo Section**: Educational context
3. **About Page**: Show company personality
4. **Blog Posts**: Interactive content marketing
5. **Landing Pages**: Lead generation tool

### Messaging Suggestions
- "Experience review management in action"
- "See how we turn complaints into compliments"
- "Play to learn our approach"
- "Interactive demo - no signup required"

## 🚀 Advanced Integration

### Lead Capture Integration
```javascript
// Add after game completion
window.addEventListener('message', function(e) {
    if (e.data.type === 'gameComplete') {
        // Show email capture form
        showLeadCaptureForm(e.data.score);
    }
});
```

### A/B Testing
Test different:
- Button colors and text
- Modal vs inline placement
- Marketing messages
- CTA positioning

## 📞 Support

Need help with integration? Contact our team:
- Technical questions: dev@promptreviews.app
- Marketing support: marketing@promptreviews.app
- Custom implementations: hello@promptreviews.app

## 🎉 Launch Checklist

- [ ] Test game loads correctly
- [ ] Verify mobile responsiveness
- [ ] Check analytics tracking
- [ ] Test lead capture (if added)
- [ ] Verify CTAs work
- [ ] Test on different browsers
- [ ] Monitor performance metrics

---

**Ready to boost engagement?** Add the game to your site in under 5 minutes! 🚀