# Prompty Power Game

## Overview
Prompty Power is an arcade-style game featuring Prompty, a character who uses a slingshot to shoot hearts at angry customers to convert them into happy 5-star reviewers. The game includes power-ups, destructible obstacles, a scoring system, and a boss battle against Karen.

## Game Location
The game is embedded within the main application at `/game` and can be accessed via the account menu navigation item "🎮 Prompty Power".

## Integration Points

### Navigation
- **Location**: Account menu dropdown (top right)
- **Label**: "🎮 Prompty Power"
- **Access**: Available to all authenticated users

### Dashboard Card
- **Location**: Dashboard main content area
- **Features**: 
  - Gradient background with game icon
  - Description and feature highlights
  - "Play Prompty Power" button
  - Feature bullets: Convert customers, Collect power-ups, Defeat Boss Karen

## Game Page Features

### Auto-Start
- Game automatically starts when embedded in the app
- No instructions screen - direct gameplay
- Seamless integration with app navigation

### Background
- Uses the app's standard blue gradient theme
- Consistent with other app pages

## Game Features

### Core Gameplay
- **Character**: Prompty with slingshot
- **Objective**: Convert angry customers to 5-star reviewers
- **Movement**: Left/right arrow keys or mouse movement
- **Shooting**: Click or spacebar to shoot hearts

### Power-ups
- **Coffee Cup**: Makes hearts more powerful (fire hearts)
- **Package [P]**: Triple-shot ability
- **Key**: Clears all customers on screen with star explosion
- **Time-limited**: All power-ups have duration limits

### Boss Battle
- **Karen**: Appears on level 2+
- **Health**: Takes 3x more hits than regular customers
- **Dialogue**: Dynamic quotes including "I want to talk to your manager"
- **Defeat**: Fades away saying "Fine."

### Scoring System
- **Points**: Earned for converting customers
- **Combo System**: Ricochet hearts for multipliers
- **Level Progression**: Time-based (1 minute per level)
- **Progressive Difficulty**: Faster enemies, more enemies per level

### Visual Effects
- **Particle Effects**: Star explosions, screen shake
- **Audio**: Sound effects for all actions
- **Victory Melody**: 9-note melody on level completion

## Leaderboard System

### Features
- **Name Input**: Players enter their name when game ends
- **Score Saving**: Automatic submission to database
- **Top 3 Display**: Shows top scores after saving
- **Full Leaderboard**: View top 100 scores in modal
- **Ranking**: Proper sorting by score, then by time

### Database
- **Table**: `game_leaderboard`
- **Fields**: `player_name`, `score`, `level`, `created_at`
- **Public Access**: Anyone can read and submit scores
- **Sanitization**: Player names cleaned of special characters

### API Endpoints
- **POST** `/api/game/save-score`: Save player score
- **GET** `/api/game/leaderboard`: Retrieve leaderboard
- **Parameters**: `limit` (default 100), `offset` (default 0)

### UI Elements
- **Name Input**: Text field with validation
- **Save Button**: Submits score to leaderboard
- **Top 3 Display**: Shows current top scores
- **View All Button**: Opens full leaderboard modal
- **Rank Styling**: Gold, silver, bronze for top 3

## Technical Implementation

### File Structure
```
public/prompty-power-game/
├── index.html          # Main game HTML
├── styles.css          # Game styling
├── game.js            # Core game logic
├── physics.js         # Physics calculations
├── spawning.js        # Entity spawning
├── drawing.js         # Rendering functions
├── ui.js             # UI management
├── ui-drawing.js     # UI rendering
├── audio.js          # Sound effects
└── leaderboard.js    # Leaderboard functionality
```

### Key Technologies
- **HTML5 Canvas**: Game rendering
- **JavaScript**: Game logic and interactions
- **Web Audio API**: Sound effects
- **Fetch API**: Leaderboard communication
- **CSS**: Styling and animations

### Game State Management
- **Global Variables**: Score, lives, level, combo
- **Power-up System**: Time-limited effects
- **Level Progression**: Time-based with difficulty scaling
- **Leaderboard Integration**: Real-time score updates

## User Experience

### Game Flow
1. **Start**: Auto-starts when embedded
2. **Gameplay**: Shoot hearts, collect power-ups, avoid obstacles
3. **Level Complete**: Victory melody, score display
4. **Game Over**: Name input, score submission, leaderboard display
5. **Play Again**: Restart option

### Leaderboard Flow
1. **Game Over**: Player sees final score and level
2. **Name Input**: Enter name (required, max 50 chars)
3. **Save Score**: Automatic submission to database
4. **Top 3 Display**: Shows current leaderboard
5. **View All**: Optional full leaderboard modal
6. **Play Again**: Return to game

### Visual Design
- **Consistent Styling**: Matches app theme
- **Responsive Layout**: Works on different screen sizes
- **Clear Hierarchy**: Score, level, combo prominently displayed
- **Intuitive Controls**: Standard gaming controls

## Future Enhancements

### Potential Features
- **Achievement System**: Badges for milestones
- **Daily Challenges**: Special objectives
- **Social Sharing**: Share scores on social media
- **Soundtrack**: Background music
- **Mobile Optimization**: Touch controls
- **Analytics**: Game usage tracking

### Technical Improvements
- **Performance**: Optimize rendering for high scores
- **Caching**: Leaderboard data caching
- **Real-time Updates**: Live leaderboard updates
- **Offline Support**: Local score storage

## Maintenance

### Database
- **Regular Cleanup**: Remove old scores if needed
- **Performance Monitoring**: Index optimization
- **Backup**: Include in regular database backups

### Code Maintenance
- **Modular Structure**: Easy to update individual components
- **Documentation**: Clear comments and structure
- **Testing**: API endpoint testing
- **Version Control**: Track all changes

## Troubleshooting

### Common Issues
- **Game Not Loading**: Check iframe permissions and X-Frame-Options
- **Score Not Saving**: Verify API endpoints and database connection
- **Leaderboard Not Displaying**: Check network requests and console errors
- **Performance Issues**: Monitor canvas rendering and memory usage

### Debug Tools
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API requests
- **Database Queries**: Verify leaderboard data
- **Game State**: Console logging for debugging

### API Testing
```bash
# Test leaderboard retrieval
curl -X GET http://localhost:3002/api/game/leaderboard

# Test score submission
curl -X POST http://localhost:3002/api/game/save-score \
  -H "Content-Type: application/json" \
  -d '{"playerName": "TestPlayer", "score": 1500, "level": 3}'
``` 