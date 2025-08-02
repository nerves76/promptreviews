/**
 * Spawning System for Prompty Power Game
 * Handles enemy spawning, object creation, and spawn timing
 */

// Emoji progression
const customerEmojis = ['😠', '😕', '😐', '😊', '😄', '🤬']; // Added red-faced emoji for speed demon

// Karen quotes array
const karenQuotes = [
    "I want to speak to the manager!",
    "You just lost a star, sweetie.",
    "Your tone is very aggressive.",
    "This is unacceptable — I demand a refund.",
    "You think I'm racist?"
];

// Teresa the Reporter quotes
const teresaQuotes = [
    "When politicians attack the press, your freedom is in danger.",
    "But is it newsworthy?",
    "Site your sources!",
    "I'm on deadline!",
    "I'm late for an interview!"
];

// Make teresaQuotes globally accessible
window.teresaQuotes = teresaQuotes;

// Spawn customers
function spawnCustomers() {
    // Door position: canvas.width / 2 - 30, 5, 60, 80
    const doorX = window.canvas.width / 2 - 30;
    const doorY = 5;
    const doorWidth = 60;
    const doorHeight = 80;
    
    // Randomly choose left or right direction
    const goLeft = Math.random() < 0.5;
    
    // Randomly determine if this is a speed demon (10% chance)
    const isSpeedDemon = Math.random() < 0.1;
    
    // Spawn emoji at the door opening (bottom of door)
    const customer = {
        x: doorX + doorWidth / 2 - 20, // Center in door, offset for emoji size
        y: doorY + doorHeight - 5, // Just below the door (adjusted for new door position)
        width: 40,
        height: 40,
        vx: goLeft ? (-1.0 - (window.level * 0.1)) : (1.0 + (window.level * 0.1)), // Level-based speed
        vy: 0,
        emojiIndex: 0,
        hits: 0,
        maxHits: 5,
        movementState: goLeft ? 'left' : 'right', // Track movement state: 'left', 'down', 'right'
        targetY: 150, // Target Y position for next row
        stuckTimer: 0, // Timer to prevent getting stuck
        direction: goLeft ? 'left' : 'right', // Store original direction for reference
        isSpeedDemon: isSpeedDemon // Mark if this is a speed demon
    };
    
    // If it's a speed demon, make it move faster
    if (isSpeedDemon) {
        customer.vx *= 2.5; // 2.5x faster than regular customers
        customer.emojiIndex = 4; // Use red-faced emoji for speed demon
    }
    
    customers.push(customer);
    
    // Trigger door animation
    doorIsOpen = true;
    doorOpenTimer = 60; // Door stays open for 1 second (60 frames)
    
    
    // Play door opening and spawn sounds
    playSound('doorCreak'); // Door creak sound
    setTimeout(() => playSound('spawn'), 200);
}

// Spawn Evil Google Exec (new boss after Karen)
function spawnEvilGoogleExec() {
    window.evilGoogleExec = {
        x: window.canvas.width / 2 - 60, // Centered, slightly bigger than Karen
        y: 80,
        width: 120, // Bigger than Karen
        height: 140, // Bigger than Karen
        health: 40, // More health than Karen
        maxHealth: 40,
        speechBubbleTimer: 0,
        speechBubbleVisible: false,
        currentQuote: "All your content belong to us!", // Always start with this quote
        quoteChangeTimer: 0,
        isDefeated: false,
        fadeTimer: 0,
        vx: 1.5, // Slightly slower than Karen
        direction: 1,
        shootTimer: 0,
        shootCooldown: 45, // Shoots every 0.75 seconds (45 frames at 60fps)
        arrowShootTimer: 120 // Shoot arrows every 2 seconds
    };
}

// Spawn Karen
function spawnKaren() {
    window.karen = {
        x: window.canvas.width / 2 - 50, // Adjusted for bigger size
        y: 100,
        width: 100, // Bigger width (was 80)
        height: 120, // Bigger height (was 100)
        health: 30, // Increased to 30 (3x original)
        maxHealth: 30,
        speechBubbleTimer: 0,
        speechBubbleVisible: false,
        currentQuote: "I want to speak to the manager!", // Always start with this quote
        quoteChangeTimer: 0, // Timer for changing quotes
        isDefeated: false, // Track if Karen is defeated
        fadeTimer: 0, // Timer for fade-out effect
        vx: 2,
        direction: 1
    };
}

// Shoot heart
function shootHeart() {
    if (hearts.length >= 8) return; // Increased from 3 to 8 hearts
    
    // More precise aiming - target the center of the mouse cursor
    const promptyCenterX = prompty.x + prompty.width / 2;
    const promptyCenterY = prompty.y + prompty.height / 2;
    const dx = mouse.x - promptyCenterX;
    const dy = mouse.y - promptyCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Prevent shooting if mouse is too close to Prompty
    if (distance < 30) return;
    
    // Calculate normalized direction vector for more accurate aiming
    const normalizedDx = dx / distance;
    const normalizedDy = dy / distance;
    
    if (activePowerUps.tripleShot.active) {
        // Triple shot - shoot in 3 directions with improved accuracy
        const angles = [-15, 0, 15]; // Left, center, right in degrees
        
        angles.forEach(angle => {
            const rad = (angle * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            
            // Rotate the direction vector for more precise spread
            const rotatedDx = normalizedDx * cos - normalizedDy * sin;
            const rotatedDy = normalizedDx * sin + normalizedDy * cos;
            
            const heart = {
                x: promptyCenterX - 12.5,
                y: promptyCenterY - 12.5,
                width: 25,
                height: 25,
                vx: rotatedDx * 22, // Slightly higher velocity for better accuracy
                vy: rotatedDy * 22,
                bounces: 0,
                maxBounces: 6,
                isPowerful: activePowerUps.powerfulHearts.active
            };
            
            hearts.push(heart);
        });
        
        // Play shoot sound once for triple shot
        playSound('shoot');
        
    } else {
        // Single shot with improved accuracy
        const heart = {
            x: promptyCenterX - 12.5,
            y: promptyCenterY - 12.5,
            width: 25,
            height: 25,
            vx: normalizedDx * 22, // Consistent velocity for better accuracy
            vy: normalizedDy * 22,
            bounces: 0,
            maxBounces: 6,
            isPowerful: activePowerUps.powerfulHearts.active
        };
        
        hearts.push(heart);
        
        // Play shoot sound
        playSound('shoot');
    }
}

// Create star explosion
function createStarExplosion(x, y) {
    for (let i = 0; i < 4; i++) { // Reduced from 8 to 4 stars
        const angle = (i / 4) * Math.PI * 2; // Adjusted angle calculation
        const speed = 3 + Math.random() * 2;
        stars.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 60,
            maxLife: 60
        });
    }
}

// Create 3 gold stars in a row for boss defeat (reduced from 5 to prevent crashes)
function createThreeStarRow(x, y) {
    const starSpacing = 50; // More space between stars for better visibility
    const startX = x - starSpacing; // Center the row of 3 stars
    
    for (let i = 0; i < 3; i++) {
        stars.push({
            x: startX + (i * starSpacing),
            y: y,
            vx: 0,
            vy: -1.5, // Move upward slower for better visibility
            life: 180, // Longer life for special effect (3 seconds)
            maxLife: 180,
            isSpecial: true // Mark as special star row
        });
    }
}

// Create 5 gold stars in a row for Karen defeat
function createFiveStarRow(x, y) {
    const starSpacing = 50; // More space between stars for better visibility
    const startX = x - (starSpacing * 2); // Center the row
    
    for (let i = 0; i < 5; i++) {
        stars.push({
            x: startX + (i * starSpacing),
            y: y,
            vx: 0,
            vy: -1.5, // Move upward slower for better visibility
            life: 180, // Longer life for special effect (3 seconds)
            maxLife: 180,
            isSpecial: true // Mark as special 5-star row
        });
    }
    

}

// Karen shoots laser
function karenShootLaser() {
    if (!karen) return;
    
    // Calculate eye positions (closer together and higher up)
    const leftEyeX = karen.x + karen.width * 0.4; // Moved closer to center
    const rightEyeX = karen.x + karen.width * 0.6; // Moved closer to center
    const eyeY = karen.y + karen.height * 0.2; // Higher up near head (was 0.3)
    
    // Create two lasers (one from each eye)
    const leftLaser = {
        x: leftEyeX - 4, // Center laser on eye
        y: eyeY,
        vx: 0,
        vy: 0.5, // Much slower downward movement (was 1)
        width: 8, // Thicker laser (was 4)
        height: 40, // Final length (was 20)
        currentHeight: 5, // Start short
        growthTimer: 0, // Timer for growth animation
        maxHeight: 40 // Maximum length
    };
    
    const rightLaser = {
        x: rightEyeX - 4, // Center laser on eye
        y: eyeY,
        vx: 0,
        vy: 0.5, // Much slower downward movement (was 1)
        width: 8, // Thicker laser (was 4)
        height: 40, // Final length (was 20)
        currentHeight: 5, // Start short
        growthTimer: 0, // Timer for growth animation
        maxHeight: 40 // Maximum length
    };
    
    karenLasers.push(leftLaser);
    karenLasers.push(rightLaser);
    
    // Play laser sound
    // playSound('laser'); // TEMPORARILY DISABLED
}

       // Spawn power-up
       function spawnPowerUp() {
           const powerUpTypes = ['key', 'package', 'coffeeCup'];
           const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];
           
           // More positions for power-ups across the board
           const positions = [
               // Top row
               { x: 100, y: 100 },
               { x: 300, y: 100 },
               { x: 500, y: 100 },
               { x: 700, y: 100 },
               
               // Middle rows
               { x: 150, y: 150 },
               { x: 350, y: 150 },
               { x: 550, y: 150 },
               { x: 200, y: 200 },
               { x: 400, y: 200 },
               { x: 600, y: 200 },
               
               // Lower rows
               { x: 100, y: 250 },
               { x: 300, y: 250 },
               { x: 500, y: 250 },
               { x: 700, y: 250 },
               { x: 250, y: 300 },
               { x: 450, y: 300 },
               { x: 650, y: 300 },
               
               // Bottom area (above Prompty)
               { x: 200, y: 350 },
               { x: 400, y: 350 },
               { x: 600, y: 350 }
           ];
           
           const randomPosition = positions[Math.floor(Math.random() * positions.length)];
           
           const powerUp = {
               x: randomPosition.x,
               y: randomPosition.y,
               width: 50, // Bigger size
               height: 50, // Bigger size
               type: randomType,
               hits: 0
           };
           
           powerUps.push(powerUp);
       }

// Spawn 1up (extra life)
function spawnOneUp() {
    // Fixed position for 1up (center top)
    const oneUp = {
        x: window.canvas.width / 2 - 25,
        y: 120,
        width: 50,
        height: 50,
        type: 'oneUp',
        hits: 0
    };
    
    powerUps.push(oneUp);
    console.log('1up spawned at center top');
}

// Activate power-up
function activatePowerUp(type) {
    if (type === 'key') {
        // Create "Sorry, we're closed" sign on door
        createClosedSign();
        activePowerUps.closedSign.active = true;
        activePowerUps.closedSign.timer = activePowerUps.closedSign.duration;
        playSound('levelUp'); // Use level up sound for effect
        console.log('Key activated - closed sign created!');
        
               } else if (type === 'package') {
               // Triple shot power-up
               activePowerUps.tripleShot.active = true;
               activePowerUps.tripleShot.timer = activePowerUps.tripleShot.duration;
               playSound('levelUp'); // Use level up sound for effect
               console.log('Package activated - triple shot!');
        
    } else if (type === 'coffeeCup') {
        // Powerful hearts power-up
        activePowerUps.powerfulHearts.active = true;
        activePowerUps.powerfulHearts.timer = activePowerUps.powerfulHearts.duration;
        playSound('levelUp'); // Use level up sound for effect
        console.log('Coffee cup activated - powerful hearts!');
    } else if (type === 'oneUp') {
        // Extra life power-up
        lives++;
        playSound('levelUp'); // Use level up sound for effect
        console.log('1up collected - extra life!');
    }
}

// Create combo effect particles
function createComboEffect(x, y, multiplier) {
    const particleCount = multiplier * 3; // More particles for higher combos
    
    for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        const particle = {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            life: 60,
            maxLife: 60,
            size: 3 + Math.random() * 3,
            color: multiplier >= 4 ? '#FFD700' : multiplier >= 3 ? '#FFA500' : '#FFFF00' // Gold, Orange, Yellow
        };
        
        // Add to stars array (reusing existing particle system)
        stars.push(particle);
    }
    
    
}

       // Create "Sorry, we're closed" sign on door
       function createClosedSign() {
           // Count customers and Karen for points
           let pointsEarned = 0;
           
           // Award points for each customer cleared
           for (let customer of customers) {
               createStarExplosion(customer.x + customer.width / 2, customer.y + customer.height / 2);
               pointsEarned += 10; // 10 points per customer
           }
           
           // Award points for Karen if she exists
           if (karen) {
               createStarExplosion(karen.x + karen.width / 2, karen.y + karen.height / 2);
               pointsEarned += 50; // 50 points for Karen
               window.karen = null;
           }
           
           // Add points to score
           score += pointsEarned;
           
           // Clear all customers
           customers.length = 0;
           
           // Create door sign
           doorSign = {
               text: 'Sorry, we\'re closed',
               timer: 180, // 3 seconds
               alpha: 1.0
           };
           

       } 

// Evil Google Exec shoots red down arrows
function evilGoogleExecShootArrow() {
    if (!window.evilGoogleExec) return;
    
    const exec = window.evilGoogleExec;
    
    // Create red down arrow
    const arrow = {
        x: exec.x + exec.width / 2 - 8, // Center of exec
        y: exec.y + exec.height, // Bottom of exec
        width: 16,
        height: 30,
        vx: 0, // No horizontal movement
        vy: 8, // Fast downward movement
        color: '#ff0000', // Red color
        life: 120 // 2 seconds life
    };
    
    if (!window.evilGoogleArrows) window.evilGoogleArrows = [];
    window.evilGoogleArrows.push(arrow);
    
    // Play ominous sound
    playSound('laser');
} 

// Create floating "SEO Boost!" text with score increase
function createSeoBoostText(x, y, scoreIncrease) {
    if (!window.floatingTexts) window.floatingTexts = [];
    
    const floatingText = {
        x: x,
        y: y,
        text: `SEO Boost! +${scoreIncrease}`,
        life: 120, // 2 seconds
        maxLife: 120,
        vy: -2, // Float upward
        alpha: 1,
        fontSize: 24,
        color: '#00ff00' // Green color for SEO boost
    };
    
    window.floatingTexts.push(floatingText);
} 

// Create floating "Mentioned in the Press!" text with score increase
function createPressMentionText(x, y, scoreIncrease) {
    if (!window.floatingTexts) window.floatingTexts = [];
    
    const floatingText = {
        x: x,
        y: y,
        text: `Mentioned in the Press! +${scoreIncrease}`,
        life: 120, // 2 seconds
        maxLife: 120,
        vy: -2, // Float upward
        alpha: 1,
        fontSize: 24,
        color: '#ff6b35' // Orange color for press mention
    };
    
    window.floatingTexts.push(floatingText);
}

function spawnTeresa() {
    window.teresa = {
        x: Math.random() * (window.canvas.width - 80), // Random position (adjusted for smaller size)
        y: 80,
        width: 60, // Smaller width (was 100)
        height: 80, // Smaller height (was 120)
        health: 25, // Health system - takes 5 hits (5 hearts = 25 damage)
        maxHealth: 25,
        speechBubbleTimer: 0,
        speechBubbleVisible: false,
        currentQuote: teresaQuotes[0], // Always start with first quote
        quoteChangeTimer: 0,
        isDefeated: false,
        fadeTimer: 0,
        vx: 2, // Fast movement
        direction: 1,
        escapeTimer: 0, // Timer for when she leaves if not defeated
        maxEscapeTime: 600, // 10 seconds before she leaves
        hitCooldown: 0 // Prevent multiple hits per frame
    };
} 

// Spawn LinkedIn Spammer boss
function spawnLinkedInSpammer() {
    try {
        window.linkedInSpammer = {
            x: 400,
            y: 100,
            width: 80,
            height: 80,
            health: 15, // More health than Karen
            maxHealth: 15,
            vx: 2,
            vy: 0,
            isDefeated: false,
            fadeTimer: 0,
            fadeDuration: 180, // 3 seconds fade
            speechBubbleVisible: false,
            speechBubbleTimer: 0,
            speechBubbleDuration: 180, // 3 seconds
            currentQuote: 0,
            quotes: [
                "Just pushing this to the top of your inbox, friend.",
                "How'd you like to double your business in just 3 months?",
                "Your customers can't find you in Google. But don't worry, I can help."
            ],
            emailThrowTimer: 0,
            emailThrowInterval: 90, // Throw email every 1.5 seconds
            emailIcon: new Image(),
            direction: 1 // 1 for right, -1 for left
        };
        
        // Load LinkedIn Spammer image
        window.linkedInSpammer.emailIcon.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/linkedin-spammer.png';
        
        // Initialize email throwing
        window.linkedInSpammer.emailThrowTimer = window.linkedInSpammer.emailThrowInterval;
        
        console.log('LinkedIn Spammer spawned');
    } catch (error) {
        console.error('Error spawning LinkedIn Spammer:', error);
    }
}

// Spawn email icon projectile
function spawnEmailIcon(x, y, vx, vy) {
    try {
        const emailIcon = {
            x: x,
            y: y,
            width: 30,
            height: 20,
            vx: vx,
            vy: vy,
            bounces: 0,
            maxBounces: 3,
            icon: new Image()
        };
        
        // Load email icon image (you can use a simple email emoji or create an email icon)
        emailIcon.icon.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTQgNEgxNkwyMEw5LjUgMTJMMCA0WiIgZmlsbD0iI0ZGRiIvPgo8cGF0aCBkPSJNMjAgNEg0TDEyIDEyTDIwIDRaIiBmaWxsPSIjRkZGIi8+CjxwYXRoIGQ9Ik0yMCA0VjE2SDRWNkw5LjUgMTJMMjAgNFoiIGZpbGw9IiNGRkYiLz4KPC9zdmc+';
        
        if (!window.emailIcons) {
            window.emailIcons = [];
        }
        window.emailIcons.push(emailIcon);
        
        console.log('Email icon spawned at:', x, y);
    } catch (error) {
        console.error('Error spawning email icon:', error);
    }
} 