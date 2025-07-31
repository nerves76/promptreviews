# 🎮 Prompty Power Game - Requirements & Specifications

## 📋 Game Overview
**Prompty Power** is a standalone arcade-style game featuring Prompty (a robot cowboy) who uses a slingshot to shoot hearts at angry customers, converting them into happy 5-star reviewers.

## 🎯 Core Gameplay Requirements

### **Player Character (Prompty)**
- **Appearance**: Robot cowboy with slingshot
- **Movement**: Left/right behind a counter using arrow keys
- **Aiming**: Mouse-based aiming with visual aiming line
- **Shooting**: Click to shoot hearts (max 3 hearts at once)
- **Position**: Stationary behind a counter at bottom of screen

### **Projectiles (Hearts)**
- **Appearance**: Solid red heart shape
- **Physics**: Bounce off walls, ceiling, and ground (max 4 bounces)
- **Velocity**: Based on mouse position and distance
- **Size**: 25x25 pixels
- **Sound**: Shooting sound effect

### **Customers (Emojis)**
- **Appearance**: Single-color emoji faces only (no bodies)
- **Emoji Progression**: 😠 → 😕 → 😐 → 😊 → 😄
- **Movement**: Snake-like path towards Prompty
- **Spawn**: From door at top of screen
- **Conversion**: 5 hits to convert to 5-star reviewer
- **Life Loss**: If they reach counter, player loses 1 life

### **Game Environment**
- **Background**: Coffee shop setting
- **Floor**: Dark grey
- **Wall**: Different color from floor (taller than floor)
- **Door**: At top center, opens/closes with sound
- **Windows**: Two windows (left and right of door)
- **Counter**: Where Prompty stands

### **UI Elements**
- **Score**: Top left (off-screen)
- **Lives**: Top right (off-screen) 
- **Level**: Top center (off-screen)
- **Game Title**: Off-screen
- **Aiming Line**: From Prompty to mouse cursor

### **Game Mechanics**
- **Lives**: Start with 3 lives
- **Scoring**: +10 per hit, +50 per converted customer
- **Levels**: Complete when all customers converted
- **Game Over**: When lives = 0

### **Technical Requirements**
- **Canvas Size**: 800x600 pixels
- **Performance**: 60 FPS smooth gameplay
- **Responsive**: Works on different screen sizes
- **Sound Effects**: Base64 encoded audio
- **No External Dependencies**: Pure HTML5/JavaScript

## 🎨 Visual Design Rules

### **Color Scheme**
- **Background**: Dark (#1a1a1a)
- **Floor**: Dark grey (#333)
- **Wall**: Slightly lighter grey (#2a2a2a)
- **Hearts**: Solid red (#ff0000)
- **UI**: White text on dark background

### **Typography**
- **Font**: Arial (system font)
- **Emoji Size**: 32px
- **UI Text**: 16px

### **Animation Rules**
- **Smooth Movement**: No jerky animations
- **Bounce Physics**: Realistic gravity and bounce
- **Door Animation**: Swing outward with sound
- **Emoji Movement**: Snake-like, not straight down

## 🔧 Technical Specifications

### **Game States**
1. **Start Screen**: Title, instructions, start button
2. **Playing**: Active gameplay
3. **Game Over**: Final score, restart button
4. **Paused**: Pause functionality (optional)

### **Input Handling**
- **Keyboard**: Arrow keys for movement
- **Mouse**: Aiming and shooting
- **Touch**: Mobile support (optional)

### **Collision Detection**
- **AABB**: Simple rectangle collision
- **Performance**: Efficient collision checking
- **Accuracy**: Precise hit detection

### **Audio Requirements**
- **Shoot Sound**: When heart is fired
- **Hit Sound**: When heart hits customer
- **Convert Sound**: When customer becomes happy
- **Door Sound**: Creak/bell when door opens
- **Game Over Sound**: When player loses

## 🚫 What NOT to Include
- **Complex Graphics**: Keep it simple and clean
- **Power-ups**: Focus on core gameplay
- **Boss Battles**: Not in initial version
- **Obstacles**: Keep it simple
- **Leaderboards**: Local storage only
- **Complex Animations**: Simple, smooth animations only

## 📝 Development Guidelines

### **Code Structure**
- **Modular Functions**: Separate drawing, update, collision functions
- **Clean Code**: Well-commented, readable code
- **Performance**: Optimize for smooth 60 FPS
- **Debugging**: Console logs for troubleshooting

### **File Organization**
- **Single HTML File**: All code in one file
- **Embedded CSS**: Styles in <style> tag
- **Embedded JavaScript**: Game logic in <script> tag
- **Base64 Audio**: Sound effects embedded in code

### **Testing Requirements**
- **Start Game**: Should start properly
- **Movement**: Smooth left/right movement
- **Shooting**: Accurate aiming and shooting
- **Collisions**: Proper hit detection
- **Scoring**: Correct score tracking
- **Lives**: Proper life management
- **Level Progression**: Complete levels correctly

## 🎯 Success Criteria
1. **Game Starts**: No freezing or errors
2. **Visuals Clean**: No brown boxes or ugly graphics
3. **Smooth Gameplay**: 60 FPS, no lag
4. **Proper Physics**: Hearts bounce realistically
5. **Accurate Controls**: Responsive mouse and keyboard
6. **Sound Effects**: Audio feedback for actions
7. **Clean UI**: All elements properly positioned
8. **No Bugs**: No freezing, crashes, or glitches

## 📋 Implementation Checklist
- [ ] Create basic HTML structure
- [ ] Set up canvas and context
- [ ] Implement game state management
- [ ] Create Prompty character (simple rectangle first)
- [ ] Add keyboard movement controls
- [ ] Implement mouse aiming
- [ ] Create heart shooting mechanics
- [ ] Add heart physics (gravity, bouncing)
- [ ] Create customer spawning system
- [ ] Implement emoji progression
- [ ] Add collision detection
- [ ] Create scoring system
- [ ] Add lives system
- [ ] Implement level progression
- [ ] Add sound effects
- [ ] Create background (floor, wall, door)
- [ ] Add UI elements
- [ ] Test and debug
- [ ] Polish visuals
- [ ] Final testing

---

**Goal**: Create a simple, clean, working arcade game that's fun to play and visually appealing without being overly complex. 