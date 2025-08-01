/**
 * Main Game Logic for Prompty Power Game
 * Handles game state, initialization, and core game loop
 * Performance optimized with monitoring tools
 */

// Performance monitoring
window.performanceMetrics = {
    frameCount: 0,
    lastFrameTime: 0,
    averageFPS: 60,
    memoryUsage: 0,
    objectCount: 0
};

// Performance optimization flags
window.performanceMode = {
    enableObjectPooling: true,
    enableFrameRateLimiting: true,
    enableMemoryCleanup: true,
    maxObjects: 1000
};

// Object pooling system for better performance
window.objectPools = {
    hearts: [],
    stars: [],
    customers: [],
    lasers: []
};

// Object pool management
function getFromPool(poolName) {
    if (window.objectPools[poolName].length > 0) {
        return window.objectPools[poolName].pop();
    }
    return null;
}

function returnToPool(poolName, object) {
    if (window.objectPools[poolName].length < 100) { // Limit pool size
        // Reset object properties
        if (object) {
            Object.keys(object).forEach(key => {
                if (typeof object[key] === 'number') object[key] = 0;
                if (typeof object[key] === 'boolean') object[key] = false;
                if (typeof object[key] === 'string') object[key] = '';
            });
        }
        window.objectPools[poolName].push(object);
    }
}

// Memory cleanup system
function performMemoryCleanup() {
    // Clean up arrays that are too large
    if (window.hearts.length > 50) {
        window.hearts = window.hearts.slice(-30); // Keep only last 30
    }
    if (window.stars.length > 30) {
        window.stars = window.stars.slice(-20); // Keep only last 20
    }
    if (window.customers.length > 20) {
        window.customers = window.customers.slice(-15); // Keep only last 15
    }
    
    // Update performance metrics
    window.performanceMetrics.objectCount = 
        window.hearts.length + 
        window.stars.length + 
        window.customers.length + 
        (window.karen ? 1 : 0) + 
        (window.evilGoogleExec ? 1 : 0) + 
        (window.linkedInSpammer ? 1 : 0);
    
    // Force garbage collection if available
    if (window.gc) {
        window.gc();
    }
}

// Game variables (made global for access from other files)
window.gameState = 'start';
window.score = 0;
window.lives = 3;
window.level = 1;
window.gameLoop = null;
window.levelStartTime = 0;
window.levelDuration = 60000; // 60 seconds in milliseconds

// Combo system
window.comboCount = 0;
window.maxCombo = 0;
window.comboMultiplier = 1;
window.lastHitTime = 0;
window.comboTimeout = 2000; // 2 seconds to maintain combo

// Screen shake system
window.screenShakeX = 0;
window.screenShakeY = 0;
window.screenShakeTimer = 0;

// Door sign system
window.doorSign = null;
window.doorSignTimer = 0;

// Load Prompty image
window.promptyImage = new Image();
window.promptyImage.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/prompty-slingshot-for-reviews.png';

// Load Karen image
window.karenImage = new Image();
window.karenImage.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/evil-karen.png';

// Load Evil Google Exec image
window.evilGoogleExecImage = new Image();
window.evilGoogleExecImage.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/evil-google-exec.png';

// Game objects
window.prompty = {
    x: 340, // Adjusted position for smaller size
    y: 400, // Moved down 20px to match new counter position
    width: 120, // Smaller (was 140)
    height: 120, // Smaller (was 140)
    speed: 5
};

// Initialize all arrays and objects
window.hearts = [];
window.customers = [];
window.mouse = { x: 0, y: 0 };
window.keys = {};
window.stars = []; // For star explosions
window.karen = null; // Karen boss
window.karenSpawnTimer = 0; // Timer for Karen spawning
window.evilGoogleExecSpawnTimer = 0; // Timer for Evil Google Exec spawning
window.teresaSpawnTimer = 0; // Initialize Teresa spawn timer
window.karenLasers = []; // Karen's laser attacks
window.karenShootTimer = 0; // Timer for Karen shooting
window.emojiSpawnTimer = 0; // Timer for emoji spawning
window.promptyHurtTimer = 0; // Timer for Prompty hurt visual effect
window.doorOpenTimer = 0; // Timer for door animation
window.doorIsOpen = false; // Door state
window.levelUpDisplayTimer = 0; // Timer for level up display
window.levelUpTextVisible = false; // Level up text visibility
window.evilGoogleArrows = []; // Initialize Evil Google Exec arrows
window.floatingTexts = []; // Initialize floating texts

// Power-up system
window.powerUps = [];
window.activePowerUps = {
    tripleShot: { active: false, timer: 0, duration: 300 }, // 5 seconds
    powerfulHearts: { active: false, timer: 0, duration: 300 }, // 5 seconds
    closedSign: { active: false, timer: 0, duration: 60 } // 1 second (instant effect)
};

// Initialize game
function init() {
    console.log('init function called!');
    
    try {
        console.log('Game initializing...');
        
        // Initialize canvas first
        if (!initCanvas()) {
            console.error('Failed to initialize canvas!');
            return;
        }
        
        // Setup roundRect polyfill
        setupRoundRect();
        
        console.log('Canvas initialized successfully');
        
        // Always show start menu for now (removed iframe auto-start logic)
        console.log('Showing start menu...');
        
        // Debug: Check if start menu element exists
        const startMenuElement = document.getElementById('startMenu');
        console.log('Start menu element found:', startMenuElement);
        if (startMenuElement) {
            console.log('Start menu display style:', startMenuElement.style.display);
            console.log('Start menu computed style:', window.getComputedStyle(startMenuElement).display);
        }
        
        // Set initial game state
        window.gameState = 'menu';
        
        showStartMenu();
        console.log('Start menu shown');
        
        // Draw initial background with timeout protection
        setTimeout(() => {
            try {
                drawBackground();
                console.log('Background drawn');
            } catch (error) {
                console.error('Error drawing background:', error);
            }
        }, 100);
        
        // Mouse movement
        window.canvas.addEventListener('mousemove', (e) => {
            const rect = window.canvas.getBoundingClientRect();
            window.mouse.x = e.clientX - rect.left;
            window.mouse.y = e.clientY - rect.top;
            
            // Initialize audio on first user interaction
            initAudio();
        });
        
        // Mouse click for shooting
        window.canvas.addEventListener('click', () => {
            // Initialize audio on first user interaction
            initAudio();
            
            if (window.gameState === 'playing') {
                // Add shooting cooldown to prevent rapid firing
                if (!window.shootCooldown) {
                    window.shootCooldown = 0;
                }
                
                if (window.shootCooldown <= 0) {
                    shootHeart();
                    window.shootCooldown = 15; // 15 frames = 0.25 seconds at 60fps
                }
            }
        });
        
        document.addEventListener('keydown', (e) => {
            // Initialize audio on first user interaction
            initAudio();
            
            window.keys[e.key] = true;
        });
        
        document.addEventListener('keyup', (e) => {
            window.keys[e.key] = false;
        });
        
        console.log('Game initialized successfully');
        
    } catch (error) {
        console.error('Error initializing game:', error);
        // Show error message to user
        const startMenu = document.getElementById('startMenu');
        if (startMenu) {
            startMenu.innerHTML = `
                <h1>🎮 Prompty Power</h1>
                <p>Game initialization failed. Please refresh the page.</p>
                <button class="button" onclick="location.reload()">Reload Game</button>
            `;
        }
    }
}

// Start game
function startGame() {
    console.log('startGame function called!');
    console.log('Current game state before start:', window.gameState);
    
    try {
        console.log('Starting game...');
        
        // Ensure canvas is available
        if (!window.canvas || !window.ctx) {
            console.error('Canvas not available, reinitializing...');
            if (!initCanvas()) {
                console.error('Failed to initialize canvas in startGame!');
                return;
            }
        }
        
        // Cancel any existing game loop to prevent multiple loops
        if (window.gameLoop) {
            cancelAnimationFrame(window.gameLoop);
            window.gameLoop = null;
            console.log('Cancelled existing game loop');
        }
        
        // Initialize audio context on first user interaction
        if (!window.audioContextInitialized) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                audioContext.resume();
                window.audioContextInitialized = true;
                console.log('Audio context initialized');
            } catch (error) {
                console.log('Audio context initialization failed:', error);
            }
        }
        
        // Reset game state
        window.gameState = 'playing';
        window.score = 0;
        window.lives = 3;
        window.level = 1;
        window.hearts = [];
        window.customers = [];
        window.customersConverted = 0; // Initialize customer death counter
        window.levelCompleteTimer = 0; // Initialize level completion timer
        window.bossDefeatTimer = 0; // Initialize boss defeat timer
        window.linkedInSpammerSpawnTimer = 0; // Initialize LinkedIn Spammer spawn timer
        
        console.log('Game state reset, window.gameState:', window.gameState);
        
        // Reset Prompty position
        window.prompty.x = 330; // Adjusted for smaller size
        window.prompty.y = 400; // Match the new counter position (moved down 20px)
        
        console.log('Prompty position reset');
        
        // Hide all screens
        const startMenu = document.getElementById('startMenu');
        const gameOver = document.getElementById('gameOver');
        const levelComplete = document.getElementById('levelComplete');
        
        if (startMenu) {
            startMenu.style.display = 'none';
            console.log('Start menu hidden');
        }
        if (gameOver) {
            gameOver.style.display = 'none';
            console.log('Game over screen hidden');
        }
        if (levelComplete) {
            levelComplete.style.display = 'none';
            console.log('Level complete screen hidden');
        }
        
        console.log('Screens hidden');
        
        // Set level start time
        window.levelStartTime = Date.now();
        
        console.log('Level start time set:', window.levelStartTime);
        
        // Spawn initial customers
        for (let k = 0; k < 3; k++) {
            setTimeout(() => {
                try {
                    spawnCustomers();
            
                } catch (error) {
                    console.error('Error spawning customers:', error);
                }
            }, k * 600);
        }
        

        
        // Draw first frame
        try {
            draw();
            console.log('First frame drawn');
        } catch (error) {
            console.error('Error drawing first frame:', error);
        }
        
        console.log('Canvas available:', window.canvas !== null);
        console.log('Canvas context available:', window.ctx !== null);
        console.log('Canvas dimensions:', window.canvas.width, 'x', window.canvas.height);
        
        // Start game loop
        try {
            window.gameLoop = requestAnimationFrame(update);
            console.log('Game loop started, gameLoop:', window.gameLoop);
        } catch (error) {
            console.error('Error starting game loop:', error);
            return;
        }
        
        console.log('Game started successfully');
        
        // Play start sound
        try {
            playSound('shoot');
            console.log('Start sound played');
        } catch (error) {
            console.error('Error playing start sound:', error);
        }
        
        // Add additional debugging
        console.log('Current game state:', window.gameState);
        console.log('Canvas dimensions:', window.canvas.width, 'x', window.canvas.height);
        console.log('Prompty position:', window.prompty.x, window.prompty.y);
    
        
    } catch (error) {
        console.error('Error in startGame:', error);
        // Try to recover by showing start menu
        try {
            showStartMenu();
        } catch (recoveryError) {
            console.error('Failed to recover from startGame error:', recoveryError);
        }
    }
}

// Reset game
function resetGame() {
    console.log('Resetting game...');
    
    // Stop current game loop
    if (window.gameLoop) {
        cancelAnimationFrame(window.gameLoop);
    }
    
    // Reset all game state
    window.gameState = 'start';
    window.score = 0;
    window.lives = 3;
    window.level = 1;
    window.hearts = [];
    window.customers = [];
    window.stars = [];
    window.karen = null;
    window.karenLasers = [];
    window.karenSpawnTimer = 0;
    window.emojiSpawnTimer = 0;
    
    // Reset Prompty position
    window.prompty.x = 330; // Adjusted for smaller size
    window.prompty.y = 420; // Match the new position
    
    // Start game immediately
    startGame();
    
    console.log('Game reset successfully');
}

// Main game loop
function update() {
    console.log('UPDATE FUNCTION CALLED - Line 1');
    const startTime = Date.now();
    
    try {
        console.log('UPDATE FUNCTION - Inside try block');
        
        // Apply screen shake decay
        if (typeof screenShakeTimer !== 'undefined' && screenShakeTimer > 0) {
            screenShakeTimer--;
            const shakeAmount = 3 * (screenShakeTimer / 30);
            screenShakeX = (Math.random() - 0.5) * shakeAmount;
            screenShakeY = (Math.random() - 0.5) * shakeAmount;
        } else {
            screenShakeX = 0;
            screenShakeY = 0;
        }
        
        console.log('Update: Starting, Karen exists:', !!karen, 'Karen health:', karen ? karen.health : 'N/A');
        
        // Decay power-ups
        if (typeof activePowerUps !== 'undefined') {
            for (let powerUpType in activePowerUps) {
                if (activePowerUps[powerUpType].active) {
                    activePowerUps[powerUpType].timer--;
                    if (activePowerUps[powerUpType].timer <= 0) {
                        activePowerUps[powerUpType].active = false;
                    }
                }
            }
        }
        
        console.log('Update: After power-ups, Karen exists:', !!karen);
        
        // Update Karen lasers (only if Karen exists)
        if (karen) {
            console.log('Update: Updating Karen lasers');
            const lasersToRemove = [];
            for (let i = 0; i < karenLasers.length; i++) {
                const laser = karenLasers[i];
                
                // Update laser growth animation
                if (laser.currentHeight < laser.maxHeight) {
                    laser.growthTimer++;
                    if (laser.growthTimer >= 2) { // Grow every 2 frames
                        laser.currentHeight += 2; // Grow by 2 pixels
                        laser.growthTimer = 0;
                    }
                }
                
                // Move laser
                laser.y += laser.vy;
                
                // Mark for removal if it goes off screen
                if (laser.x < 0 || laser.x > window.canvas.width || 
                    laser.y < 0 || laser.y > window.canvas.height) {
                    lasersToRemove.push(i);
                    continue;
                }
                
                // Check collision with tables
                const tables = [
                    {x: 150, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
                    {x: 550, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
                    {x: 350, y: window.canvas.height - 330, width: 80, height: 60}  // Moved down 20px
                ];
                
                let hitTable = false;
                for (let table of tables) {
                    if (laser.x < table.x + table.width &&
                        laser.x + laser.width > table.x &&
                        laser.y < table.y + table.height &&
                        laser.y + laser.height > table.y) {
                        
                        // Laser hit table, mark for removal
                        lasersToRemove.push(i);
                        hitTable = true;
                        break;
                    }
                }
                
                // Mark for removal if off screen (only if didn't hit table)
                if (!hitTable && laser.y > window.canvas.height) {
                    lasersToRemove.push(i);
                }
            }
            
            // Remove marked lasers (in reverse order to maintain indices)
            for (let i = lasersToRemove.length - 1; i >= 0; i--) {
                karenLasers.splice(lasersToRemove[i], 1);
            }
            
            // Check Karen laser collisions with Prompty (RE-ENABLED WITH SIMPLE LOGIC)
            if (karenLasers && karenLasers.length > 0) {
                for (let i = karenLasers.length - 1; i >= 0; i--) {
                    const laser = karenLasers[i];
                    
                    // Update laser position
                    laser.y += laser.vy;
                    
                    // Remove lasers that go off screen
                    if (laser.y > window.canvas.height) {
                        karenLasers.splice(i, 1);
                        continue;
                    }
                    
                    // Check collision with Prompty
                    if (laser.x < window.prompty.x + window.prompty.width &&
                        laser.x + laser.width > window.prompty.x &&
                        laser.y < window.prompty.y + window.prompty.height &&
                        laser.y + laser.height > window.prompty.y) {
                        
                        // Prompty gets hit by laser
                        window.lives--;
                        
                        // Visual hurt effect
                        window.promptyHurtTimer = 30;
                        
                        // Remove the laser that hit Prompty
                        karenLasers.splice(i, 1);
                        
                        if (window.lives <= 0) {
                            gameOver();
                            return;
                        }
                    }
                }
            }
        }
        
        console.log('Update: After Karen laser updates, Karen exists:', !!karen);
        
        // Simple movement
        if (window.keys['ArrowLeft'] && window.prompty.x > 0) {
            window.prompty.x -= 5;
        }
        if (window.keys['ArrowRight'] && window.prompty.x < window.canvas.width - window.prompty.width) {
            window.prompty.x += 5;
        }
        
        // Update physics
        updateHearts();
        updateCustomers();
        
        // Update shooting cooldown
        if (window.shootCooldown > 0) {
            window.shootCooldown--;
        }
        
        // Handle boss defeat timers (REMOVED - using immediate defeat)
        // All boss defeats now happen immediately without timers to prevent freezing
        
    // Controlled emoji spawning
    emojiSpawnTimer++;
    // Spawn new customers periodically
    if (emojiSpawnTimer > 240 && window.customers.length < 8) { // Spawn every 4 seconds (was 3 seconds)
        // TEMPORARILY DISABLED BOSS SPAWNING CONDITION
        /*
        // Don't spawn new customers if a boss should appear
        const shouldSpawnBoss = (window.level >= 1 && !karen) || 
                               (window.level >= 2 && !karen && !window.evilGoogleExec) || 
                               (window.level >= 1 && !karen && !window.evilGoogleExec && !window.teresa);
        
        if (!shouldSpawnBoss) {
            spawnCustomers();
        }
        */
        
        // Always spawn customers for now since bosses are disabled
        spawnCustomers();
        emojiSpawnTimer = 0;
    } else {
        // Spawn bosses when most customers are converted
        const remainingCustomers = window.customers.length;
        const shouldSpawnBoss = remainingCustomers <= 2; // Changed from 1 to 2 to be more lenient
        
        // FIXED BOSS SPAWNING LOGIC - ONLY ONE BOSS AT A TIME
        if (window.level >= 1 && shouldSpawnBoss && !karen && !window.evilGoogleExec && !window.linkedInSpammer && !window.teresa && !window.karenDefeated) {
            // Add a delay before spawning Karen (3 seconds)
            if (!window.karenSpawnTimer) {
                window.karenSpawnTimer = 180; // 3 seconds at 60fps
            } else {
                window.karenSpawnTimer--;

                if (window.karenSpawnTimer <= 0) {
                    spawnKaren();
                    window.karenSpawnTimer = 0; // Reset timer
                }
            }
        } else if (window.karenSpawnTimer > 0) {
            // Reset timer if conditions are no longer met
            window.karenSpawnTimer = 0;
        }
        
        // Spawn Evil Google Exec on level 2+ (only if no other boss exists)
        if (window.level >= 2 && shouldSpawnBoss && !karen && !window.evilGoogleExec && !window.linkedInSpammer && !window.teresa) {
            // Add a delay before spawning Evil Google Exec (4 seconds)
            if (!window.evilGoogleExecSpawnTimer) {
                window.evilGoogleExecSpawnTimer = 240; // 4 seconds at 60fps
            } else {
                window.evilGoogleExecSpawnTimer--;

                if (window.evilGoogleExecSpawnTimer <= 0) {
                    spawnEvilGoogleExec();
                    window.evilGoogleExecSpawnTimer = 0; // Reset timer
                }
            }
        } else if (window.evilGoogleExecSpawnTimer > 0) {
            // Reset timer if conditions are no longer met
            window.evilGoogleExecSpawnTimer = 0;
        }
        
        // Spawn LinkedIn Spammer on level 3+ (only if no other boss exists)
        if (window.level >= 3 && shouldSpawnBoss && !karen && !window.evilGoogleExec && !window.linkedInSpammer && !window.teresa) {
            // Add a delay before spawning LinkedIn Spammer (2 seconds)
            if (!window.linkedInSpammerSpawnTimer) {
                window.linkedInSpammerSpawnTimer = 120; // 2 seconds at 60fps
            } else {
                window.linkedInSpammerSpawnTimer--;

                if (window.linkedInSpammerSpawnTimer <= 0) {
                    spawnLinkedInSpammer();
                    window.linkedInSpammerSpawnTimer = 0; // Reset timer
                }
            }
        } else if (window.linkedInSpammerSpawnTimer > 0) {
            // Reset timer if conditions are no longer met
            window.linkedInSpammerSpawnTimer = 0;
        }
    }
    
    // Spawn power-ups less frequently
    if (Math.random() < 0.001 && powerUps.length < 3) { // 0.1% chance per frame, max 3 power-ups
        spawnPowerUp();
    }
    
    // Spawn 1up very rarely (0.1% chance per frame, only if no 1up exists)
    if (Math.random() < 0.001 && !powerUps.some(p => p.type === 'oneUp')) {
        spawnOneUp();
    }
    
    // Update door animation
    if (doorIsOpen) {
        doorOpenTimer--;
        if (doorOpenTimer <= 0) {
            doorIsOpen = false;
        }
    }
    
    // Update level up display
    if (levelUpTextVisible) {
        levelUpDisplayTimer--;
        if (levelUpDisplayTimer <= 0) {
            levelUpTextVisible = false;
        }
    }
    
    // Update power-ups (stationary)
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        // Power-ups are stationary, no movement needed
    }
    
    // Update active power-up timers
    for (let powerUpType in activePowerUps) {
        if (activePowerUps[powerUpType].active) {
            activePowerUps[powerUpType].timer--;
            if (activePowerUps[powerUpType].timer <= 0) {
                activePowerUps[powerUpType].active = false;
            }
        }
    }
    
    // Update Karen lasers (only if Karen exists)
    if (karen) {
        const lasersToRemove = [];
        for (let i = 0; i < karenLasers.length; i++) {
            const laser = karenLasers[i];
            
            // Update laser growth animation
            if (laser.currentHeight < laser.maxHeight) {
                laser.growthTimer++;
                if (laser.growthTimer >= 2) { // Grow every 2 frames
                    laser.currentHeight += 2; // Grow by 2 pixels
                    laser.growthTimer = 0;
                }
            }
            
            // Move laser
            laser.y += laser.vy;
            
            // Mark for removal if it goes off screen
            if (laser.x < 0 || laser.x > window.canvas.width || 
                laser.y < 0 || laser.y > window.canvas.height) {
                lasersToRemove.push(i);
                continue;
            }
            
            // Check collision with tables
            const tables = [
                {x: 150, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
                {x: 550, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
                {x: 350, y: window.canvas.height - 330, width: 80, height: 60}  // Moved down 20px
            ];
            
            let hitTable = false;
            for (let table of tables) {
                if (laser.x < table.x + table.width &&
                    laser.x + laser.width > table.x &&
                    laser.y < table.y + table.height &&
                    laser.y + laser.height > table.y) {
                    
                    // Laser hit table, mark for removal
                    lasersToRemove.push(i);
                    hitTable = true;
                    break;
                }
            }
            
            // Mark for removal if off screen (only if didn't hit table)
            if (!hitTable && laser.y > window.canvas.height) {
                lasersToRemove.push(i);
            }
        }
        
        // Remove marked lasers (in reverse order to maintain indices)
        for (let i = lasersToRemove.length - 1; i >= 0; i--) {
            karenLasers.splice(lasersToRemove[i], 1);
        }
        
        // Check Karen laser collisions with Prompty (RE-ENABLED WITH SIMPLE LOGIC)
        if (karenLasers && karenLasers.length > 0) {
            for (let i = karenLasers.length - 1; i >= 0; i--) {
                const laser = karenLasers[i];
                
                // Update laser position
                laser.y += laser.vy;
                
                // Remove lasers that go off screen
                if (laser.y > window.canvas.height) {
                    karenLasers.splice(i, 1);
                    continue;
                }
                
                // Check collision with Prompty
                if (laser.x < window.prompty.x + window.prompty.width &&
                    laser.x + laser.width > window.prompty.x &&
                    laser.y < window.prompty.y + window.prompty.height &&
                    laser.y + laser.height > window.prompty.y) {
                    
                    // Prompty gets hit by laser
                    window.lives--;
                    
                    // Visual hurt effect
                    window.promptyHurtTimer = 30;
                    
                    // Remove the laser that hit Prompty
                    karenLasers.splice(i, 1);
                    
                    if (window.lives <= 0) {
                        gameOver();
                        return;
                    }
                }
            }
        }
    }
    
    // Check power-up collisions with hearts
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        
        // Initialize hit counter if not exists
        if (!powerUp.hits) {
            powerUp.hits = 0;
        }
        
        // Check collision with hearts
        const heartsToRemove = [];
        for (let j = 0; j < hearts.length; j++) {
            const heart = hearts[j];
            
            if (heart.x < powerUp.x + powerUp.width &&
                heart.x + heart.width > powerUp.x &&
                heart.y < powerUp.y + powerUp.height &&
                heart.y + heart.height > powerUp.y) {
                
                // Hit power-up
                powerUp.hits++;
                heartsToRemove.push(j);
                
                // Play hit sound
                playSound('bounce');
                
                // Activate if 5 hits reached
                if (powerUp.hits >= 5) {
                    activatePowerUp(powerUp.type);
                    powerUps.splice(i, 1);
                    break;
                }
            }
        }
        
        // Remove hearts that hit power-ups (in reverse order)
        for (let j = heartsToRemove.length - 1; j >= 0; j--) {
            hearts.splice(heartsToRemove[j], 1);
        }
    }
    
    // Simple collision
    const customersToRemove = [];
    for (let i = hearts.length - 1; i >= 0; i--) {
        for (let j = window.customers.length - 1; j >= 0; j--) {
            const heart = hearts[i];
            const customer = window.customers[j];
            
            if (heart.x < customer.x + customer.width &&
                heart.x + heart.width > customer.x &&
                heart.y < customer.y + customer.height &&
                heart.y + heart.height > customer.y) {
                
                // Hit customer - fire hearts do more damage
                const damage = heart.isPowerful ? 2 : 1; // Fire hearts do 2 damage, normal hearts do 1
                customer.hits += damage;
                customer.emojiIndex = Math.min(customer.hits, customerEmojis.length - 1);
                
                // Ricochet heart instead of removing it
                const heartCenterX = heart.x + heart.width / 2;
                const heartCenterY = heart.y + heart.height / 2;
                const customerCenterX = customer.x + customer.width / 2;
                const customerCenterY = customer.y + customer.height / 2;
                
                // Calculate ricochet direction
                const dx = heartCenterX - customerCenterX;
                const dy = heartCenterY - customerCenterY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 0) {
                    // Normalize and apply ricochet with some randomness
                    const ricochetSpeed = 15 + Math.random() * 5; // 15-20 speed
                    heart.vx = (dx / distance) * ricochetSpeed;
                    heart.vy = (dy / distance) * ricochetSpeed;
                    
                    // Add some randomness to ricochet angle
                    const angleVariation = (Math.random() - 0.5) * 0.5; // ±0.25 radians
                    const cos = Math.cos(angleVariation);
                    const sin = Math.sin(angleVariation);
                    const newVx = heart.vx * cos - heart.vy * sin;
                    const newVy = heart.vx * sin + heart.vy * cos;
                    heart.vx = newVx;
                    heart.vy = newVy;
                    
                    // Increment bounce count
                    heart.bounces++;
                    
                    // Play bounce sound
                    playSound('bounce');
                }
                
                // Update combo system for ricochet hits
                const currentTime = Date.now();
                if (currentTime - lastHitTime < comboTimeout) {
                    comboCount++;
                    comboMultiplier = Math.min(comboCount + 1, 5); // Max 5x multiplier
                    if (comboCount > maxCombo) {
                        maxCombo = comboCount;
                    }
                } else {
                    comboCount = 1;
                    comboMultiplier = 2;
                }
                lastHitTime = currentTime;
                
                // Add score for emoji hit with combo multiplier
                const baseScore = 5;
                const comboScore = baseScore * comboMultiplier;
                window.score += comboScore;
                
                // Play emoji hit sound
                playSound('emojiHit');
                
                // Create combo particle effect
                createComboEffect(customer.x + customer.width / 2, customer.y + customer.height / 2, comboMultiplier);
                
                // Check if customer converted (5 hits)
                if (customer.hits >= 5) {
                    window.score += 10; // Additional Authority Score for conversion
                    window.customersConverted++; // Increment death counter
                    // Create star explosion
                    createStarExplosion(customer.x + customer.width / 2, customer.y + customer.height / 2);
                    // Create 5-star row to emphasize getting reviews
                    createFiveStarRow(customer.x + customer.width / 2, customer.y + customer.height / 2);
                    customersToRemove.push(j);
                    
                    // Play convert sound
                    playSound('convert');
                    
                    // Customer conversion complete - no level completion logic here
                    // Level completion is now only triggered by boss defeats
                } else {
                    // Emoji progressed but not fully converted
            
                }
                
                break;
            }
        }
    }
    
    // Remove customers that were converted
    for (let i = customersToRemove.length - 1; i >= 0; i--) {
        window.customers.splice(customersToRemove[i], 1);
    }
    
    // Update timer display (keep for reference)
    if (window.gameState === 'playing' && window.levelStartTime > 0) {
        const timerElement = document.getElementById('timer');
        if (timerElement) {
            const baseCustomerCount = 10;
            const customerCount = Math.min(Math.floor(baseCustomerCount * Math.pow(1.3, window.level - 1)), 50);
            const requiredDeaths = customerCount;
            timerElement.textContent = `Customers: ${window.customersConverted}/${requiredDeaths}`;
        }
    }
    
    // Check Karen collisions (RE-ENABLED WITH SIMPLE LOGIC)
    if (karen) {
        for (let i = hearts.length - 1; i >= 0; i--) {
            const heart = hearts[i];
            
            if (heart.x < karen.x + karen.width &&
                heart.x + heart.width > karen.x &&
                heart.y < karen.y + karen.height &&
                heart.y + heart.height > karen.y) {
                
                // Hit Karen - fire hearts do more damage
                const damage = heart.isPowerful ? 2 : 1;
                karen.health -= damage;
                
                // Simple ricochet
                heart.vx *= -0.8;
                heart.vy *= -0.8;
                heart.bounces++;
                
                if (karen.health <= 0) {
                    // Boss defeated - with simple animation
                    window.score += 100;
                    window.customersConverted++;
                    
                    // Create star explosion (same as emojis)
                    createStarExplosion(karen.x + karen.width / 2, karen.y + karen.height / 2);
                    createFiveStarRow(karen.x + karen.width / 2, karen.y + karen.height / 2);
                    
                    // Create floating points text
                    createFloatingText('+100', karen.x + karen.width / 2, karen.y + karen.height / 2, '#FFD700');
                    
                    // IMMEDIATE defeat - no timers, just clear and complete
                    karen = null;
                    window.karenDefeated = true;
                    
                    // Clear arrays after animation starts
                    hearts = [];
                    powerUps = [];
                    window.karenLasers = [];
                    
                    // Complete level immediately
                    window.level++;
                    window.gameState = 'levelComplete';
                    showLevelComplete();
                    return;
                }
                
                break;
            }
        }
    }
    
    // Check collision with Evil Google Exec (RE-ENABLED WITH SIMPLE LOGIC)
    if (window.evilGoogleExec) {
        for (let i = hearts.length - 1; i >= 0; i--) {
            const heart = hearts[i];
            
            if (heart.x < window.evilGoogleExec.x + window.evilGoogleExec.width &&
                heart.x + heart.width > window.evilGoogleExec.x &&
                heart.y < window.evilGoogleExec.y + window.evilGoogleExec.height &&
                heart.y + heart.height > window.evilGoogleExec.y) {
                
                // Hit Evil Google Exec - fire hearts do more damage
                const damage = heart.isPowerful ? 2 : 1;
                window.evilGoogleExec.health -= damage;
                
                // Simple ricochet
                heart.vx *= -0.8;
                heart.vy *= -0.8;
                heart.bounces++;
                
                if (window.evilGoogleExec.health <= 0) {
                    // Boss defeated - with simple animation
                    window.score += 100;
                    window.customersConverted++;
                    
                    // Create star explosion (same as emojis)
                    createStarExplosion(window.evilGoogleExec.x + window.evilGoogleExec.width / 2, window.evilGoogleExec.y + window.evilGoogleExec.height / 2);
                    createFiveStarRow(window.evilGoogleExec.x + window.evilGoogleExec.width / 2, window.evilGoogleExec.y + window.evilGoogleExec.height / 2);
                    
                    // Create floating points text
                    createFloatingText('+100', window.evilGoogleExec.x + window.evilGoogleExec.width / 2, window.evilGoogleExec.y + window.evilGoogleExec.height / 2, '#FFD700');
                    
                    // IMMEDIATE defeat - no timers, just clear and complete
                    window.evilGoogleExec = null;
                    
                    // Clear arrays after animation starts
                    hearts = [];
                    powerUps = [];
                    window.evilGoogleArrows = [];
                    
                    // Complete level immediately
                    window.level++;
                    window.gameState = 'levelComplete';
                    showLevelComplete();
                    return;
                }
                
                break;
            }
        }
    }
    
    // Check collision with LinkedIn Spammer
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        
        if (window.linkedInSpammer && !window.linkedInSpammer.isDefeated &&
            heart.x < window.linkedInSpammer.x + window.linkedInSpammer.width &&
            heart.x + heart.width > window.linkedInSpammer.x &&
            heart.y < window.linkedInSpammer.y + window.linkedInSpammer.height &&
            heart.y + heart.height > window.linkedInSpammer.y) {
            
            // Hit LinkedIn Spammer - fire hearts do more damage
            const damage = heart.isPowerful ? 2 : 1; // Fire hearts do 2 damage, normal hearts do 1
            window.linkedInSpammer.health -= damage;
            
            // Ricochet heart off LinkedIn Spammer
            const heartCenterX = heart.x + heart.width / 2;
            const heartCenterY = heart.y + heart.height / 2;
            const spammerCenterX = window.linkedInSpammer.x + window.linkedInSpammer.width / 2;
            const spammerCenterY = window.linkedInSpammer.y + window.linkedInSpammer.height / 2;
            
            // Calculate ricochet direction
            const dx = heartCenterX - spammerCenterX;
            const dy = heartCenterY - spammerCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Normalize and apply ricochet with some randomness
                const ricochetSpeed = 18 + Math.random() * 7; // 18-25 speed
                heart.vx = (dx / distance) * ricochetSpeed;
                heart.vy = (dy / distance) * ricochetSpeed;
                
                // Add some randomness to ricochet angle
                const angleVariation = (Math.random() - 0.5) * 0.3; // ±0.15 radians
                const cos = Math.cos(angleVariation);
                const sin = Math.sin(angleVariation);
                const newVx = heart.vx * cos - heart.vy * sin;
                const newVy = heart.vx * sin + heart.vy * cos;
                heart.vx = newVx;
                heart.vy = newVy;
                
                // Increment bounce count
                heart.bounces++;
                
                // Play bounce sound
                playSound('bounce');
            }
            
            // Update combo system for LinkedIn Spammer ricochet hits
            const currentTime = Date.now();
            if (currentTime - lastHitTime < comboTimeout) {
                comboCount++;
                comboMultiplier = Math.min(comboCount + 1, 5); // Max 5x multiplier
                if (comboCount > maxCombo) {
                    maxCombo = comboCount;
                }
            } else {
                comboCount = 1;
                comboMultiplier = 2;
            }
            lastHitTime = currentTime;
            
            // Add score for LinkedIn Spammer hit with combo multiplier
            const baseScore = 12; // Points for LinkedIn Spammer
            const comboScore = baseScore * comboMultiplier;
            window.score += comboScore;
            
            // Create combo particle effect
            createComboEffect(heart.x, heart.y, comboMultiplier);
            
            // Create star explosion for LinkedIn Spammer hit
            createStarExplosion(heart.x, heart.y);
            
            // Play LinkedIn Spammer hit sound
            playSound('karenHit'); // Use same sound as Karen for now
            
            if (window.linkedInSpammer.health <= 0) {
                // Boss defeated - with simple animation
                window.score += 100;
                window.customersConverted++;
                
                // Create star explosion (same as emojis)
                createStarExplosion(window.linkedInSpammer.x + window.linkedInSpammer.width / 2, window.linkedInSpammer.y + window.linkedInSpammer.height / 2);
                createFiveStarRow(window.linkedInSpammer.x + window.linkedInSpammer.width / 2, window.linkedInSpammer.y + window.linkedInSpammer.height / 2);
                
                // Create floating points text
                createFloatingText('+100', window.linkedInSpammer.x + window.linkedInSpammer.width / 2, window.linkedInSpammer.y + window.linkedInSpammer.height / 2, '#FFD700');
                
                // IMMEDIATE defeat - no timers, just clear and complete
                window.linkedInSpammer = null;
                
                // Clear arrays after animation starts
                hearts = [];
                powerUps = [];
                window.emailIcons = [];
                
                // Complete level immediately
                window.level++;
                window.gameState = 'levelComplete';
                showLevelComplete();
                return;
            }
            
            break;
        }
    }
    
    // Update stars
    const starsToRemove = [];
    
    // Memory management: limit stars array size
    if (stars.length > 100) {
        stars.splice(0, 20); // Remove oldest 20 stars
    }
    
    for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        star.x += star.vx;
        star.y += star.vy;
        star.life--;
        
        if (star.life <= 0) {
            starsToRemove.push(i);
        }
    }
    
    // Remove dead stars (in reverse order)
    for (let i = starsToRemove.length - 1; i >= 0; i--) {
        stars.splice(starsToRemove[i], 1);
    }
    
    // Update combo system
    const currentTime = Date.now();
    if (currentTime - lastHitTime > comboTimeout && comboCount > 0) {
        comboCount = 0;
        comboMultiplier = 1;

    }
    
    // Update screen shake
    if (screenShakeTimer > 0) {
        screenShakeTimer--;
        screenShakeX = (Math.random() - 0.5) * 10;
        screenShakeY = (Math.random() - 0.5) * 10;
    } else {
        screenShakeX = 0;
        screenShakeY = 0;
    }
    
    // Update door sign
    if (doorSign) {
        doorSign.timer--;
        doorSign.alpha = doorSign.timer / 180; // Fade over 3 seconds
        
        if (doorSign.timer <= 0) {
            doorSign = null;

        }
    }
    
    // Update Teresa the Reporter (TEMPORARILY DISABLED)
    /*
    if (window.teresa) {
        try {
            const teresa = window.teresa;
            
            // Debug logging
            if (window.updateCallCount % 60 === 0) { // Log every 60 frames
                console.log('Updating Teresa:', {
                    x: teresa.x,
                    y: teresa.y,
                    isDefeated: teresa.isDefeated,
                    fadeTimer: teresa.fadeTimer,
                    escapeTimer: teresa.escapeTimer,
                    speechBubbleVisible: teresa.speechBubbleVisible
                });
            }
            
            if (teresa.isDefeated) {
                teresa.fadeTimer++;
                if (teresa.fadeTimer >= 120) { // 2 seconds fade-out
                    // Teresa completely faded out
                    window.teresa = null;
                    console.log('Teresa completely faded out and removed!');
                }
                return; // Skip other Teresa updates during fade-out
            }
            
            // Update escape timer
            teresa.escapeTimer++;
            if (teresa.escapeTimer >= teresa.maxEscapeTime) {
                // Teresa leaves if not defeated in time
                console.log('Teresa left without being defeated!');
                window.teresa = null;
                return;
            }
            
            // Move Teresa side to side
            teresa.x += teresa.vx * teresa.direction;
            
            // Bounce off edges
            if (teresa.x <= 0 || teresa.x + teresa.width >= window.canvas.width) {
                teresa.direction *= -1;
            }
            
            // Speech bubble timing
            teresa.speechBubbleTimer++;
            if (teresa.speechBubbleTimer >= 180) { // Show speech bubble every 3 seconds
                teresa.speechBubbleVisible = true;
                teresa.speechBubbleTimer = 0;
            }
            
            if (teresa.speechBubbleVisible && teresa.speechBubbleTimer >= 120) { // Hide after 2 seconds
                teresa.speechBubbleVisible = false;
            }
            
            // Quote change timing
            teresa.quoteChangeTimer++;
            if (teresa.quoteChangeTimer >= 480) { // Change quote every 8 seconds
                if (window.teresaQuotes && window.teresaQuotes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * window.teresaQuotes.length);
                    teresa.currentQuote = window.teresaQuotes[randomIndex];
                } else {
                    console.warn('teresaQuotes not available, using default quote');
                    teresa.currentQuote = "I'm on deadline!";
                }
                teresa.quoteChangeTimer = 0;
            }
            
            // Decrease hit cooldown
            if (teresa.hitCooldown > 0) {
                teresa.hitCooldown--;
            }
            
        } catch (error) {
            console.error('Error updating Teresa:', error);
            window.teresa = null;
        }
    }
    */
    
    // Update Karen boss (RE-ENABLED WITH SIMPLE LOGIC)
    if (karen) {
        // Move Karen side to side
        const karenSpeed = 2 + (window.level * 0.5);
        karen.x += karenSpeed * karen.direction;
        
        // Bounce off walls
        if (karen.x <= 50 || karen.x >= window.canvas.width - 150) {
            karen.direction *= -1;
        }
        
        // Simple speech bubble timing
        if (!karen.speechBubbleTimer) karen.speechBubbleTimer = 0;
        karen.speechBubbleTimer++;
        
        if (karen.speechBubbleTimer > 120) { // Show speech bubble every 2 seconds
            karen.speechBubbleVisible = !karen.speechBubbleVisible;
            karen.speechBubbleTimer = 0;
        }
        
        // Change quote every 8 seconds
        if (!karen.quoteChangeTimer) karen.quoteChangeTimer = 0;
        karen.quoteChangeTimer++;
        if (karen.quoteChangeTimer > 480) { // 8 seconds
            const karenQuotes = [
                "You just lost a star, sweetie.",
                "Your tone is very aggressive.",
                "This is unacceptable — I demand a refund.",
                "You think I'm racist?"
            ];
            karen.currentQuote = karenQuotes[Math.floor(Math.random() * karenQuotes.length)];
            karen.quoteChangeTimer = 0;
        }
        
        // Simple laser shooting
        if (!karenShootTimer) karenShootTimer = 0;
        if (karenShootTimer > 0) {
            karenShootTimer--;
        }
        
        // Shoot lasers periodically (only when not already shooting)
        if (karenShootTimer <= 0 && Math.random() < 0.005) { // 0.5% chance per frame (very rare)
            karenShootLaser();
            karenShootTimer = 60; // Stop moving for 60 frames (1 second)
        }
    }
    
    // Update Evil Google Exec (RE-ENABLED WITH SIMPLE LOGIC)
    if (window.evilGoogleExec) {
        // Move Evil Google Exec side to side
        const execSpeed = 1.5 + (window.level * 0.3);
        window.evilGoogleExec.x += execSpeed * window.evilGoogleExec.direction;
        
        // Bounce off walls
        if (window.evilGoogleExec.x <= 50 || window.evilGoogleExec.x >= window.canvas.width - 170) {
            window.evilGoogleExec.direction *= -1;
        }
        
        // Simple speech bubble timing
        if (!window.evilGoogleExec.speechBubbleTimer) window.evilGoogleExec.speechBubbleTimer = 0;
        window.evilGoogleExec.speechBubbleTimer++;
        
        if (window.evilGoogleExec.speechBubbleTimer > 180) { // Show speech bubble every 3 seconds
            window.evilGoogleExec.speechBubbleVisible = !window.evilGoogleExec.speechBubbleVisible;
            window.evilGoogleExec.speechBubbleTimer = 0;
        }
        
        // Change quote every 6 seconds
        if (!window.evilGoogleExec.quoteChangeTimer) window.evilGoogleExec.quoteChangeTimer = 0;
        window.evilGoogleExec.quoteChangeTimer++;
        if (window.evilGoogleExec.quoteChangeTimer > 360) { // 6 seconds
            const execQuotes = [
                "It's pay-to-play, baby!",
                "Is being Evil really so bad?"
            ];
            window.evilGoogleExec.currentQuote = execQuotes[Math.floor(Math.random() * execQuotes.length)];
            window.evilGoogleExec.quoteChangeTimer = 0;
        }
    }
    
    // Update Evil Google Exec arrows
    if (window.evilGoogleArrows) {
        try {
            for (let i = window.evilGoogleArrows.length - 1; i >= 0; i--) {
                const arrow = window.evilGoogleArrows[i];
                arrow.y += arrow.vy;
                arrow.life--;
                
                // Remove arrows that are off screen or expired
                if (arrow.y > window.canvas.height || arrow.life <= 0) {
                    window.evilGoogleArrows.splice(i, 1);
                }
                
                // Check collision with Prompty
                if (arrow.x < window.prompty.x + window.prompty.width &&
                    arrow.x + arrow.width > window.prompty.x &&
                    arrow.y < window.prompty.y + window.prompty.height &&
                    arrow.y + arrow.height > window.prompty.y) {
                    
                    // Prompty gets hit by arrow
                    window.lives--;
                    playTripleOuch();
                    
                    // Visual hurt effect
                    window.promptyHurtTimer = 30;
                    
                    // Remove the arrow
                    window.evilGoogleArrows.splice(i, 1);
                    
                    if (window.lives <= 0) {
                        gameOver();
                        return;
                    }
                }
            }
        } catch (error) {
            console.error('Error updating Evil Google Exec arrows:', error);
            // Clear the problematic arrows array
            window.evilGoogleArrows = [];
        }
    }
    
    // Evil Google Exec shoots arrows periodically
    if (window.evilGoogleExec && !window.evilGoogleExec.isDefeated) {
        window.evilGoogleExec.arrowShootTimer--;
        if (window.evilGoogleExec.arrowShootTimer <= 0) {
            evilGoogleExecShootArrow();
            window.evilGoogleExec.arrowShootTimer = 120; // Shoot every 2 seconds
        }
    }
    
    // Update LinkedIn Spammer boss
    if (window.linkedInSpammer) {
        // Handle defeated LinkedIn Spammer fade-out
        if (window.linkedInSpammer.isDefeated) {
            window.linkedInSpammer.fadeTimer++;
            if (window.linkedInSpammer.fadeTimer >= 60) { // 1 second fade-out
                // Complete level after fade-out
                window.score += 25; // Additional Authority Score for defeating LinkedIn Spammer
                
                // Clear everything
                hearts = [];
                powerUps = [];
                stars = [];
                karenLasers = [];
                doorSign = null;
                if (window.emailIcons) {
                    window.emailIcons = [];
                }
                window.linkedInSpammer = null;
                
                // Complete level
                window.level++;
                window.gameState = 'levelComplete';
                showLevelComplete();
                return; // Stop the game loop during level transition
            }
            return; // Skip other LinkedIn Spammer updates during fade-out
        }
        
        // Move LinkedIn Spammer
        window.linkedInSpammer.x += window.linkedInSpammer.vx;
        
        // Bounce off walls
        if (window.linkedInSpammer.x <= 0 || window.linkedInSpammer.x + window.linkedInSpammer.width >= window.canvas.width) {
            window.linkedInSpammer.vx *= -1;
            window.linkedInSpammer.direction *= -1;
        }
        
        // Throw email icons periodically
        window.linkedInSpammer.emailThrowTimer--;
        if (window.linkedInSpammer.emailThrowTimer <= 0) {
            // Throw email icon
            const throwX = window.linkedInSpammer.x + window.linkedInSpammer.width / 2;
            const throwY = window.linkedInSpammer.y + window.linkedInSpammer.height;
            const throwVx = (Math.random() - 0.5) * 8; // Random horizontal velocity
            const throwVy = 5 + Math.random() * 3; // Downward velocity with some randomness
            
            spawnEmailIcon(throwX, throwY, throwVx, throwVy);
            window.linkedInSpammer.emailThrowTimer = window.linkedInSpammer.emailThrowInterval;
        }
        
        // Update speech bubble
        if (!window.linkedInSpammer.speechBubbleVisible) {
            window.linkedInSpammer.speechBubbleTimer++;
            if (window.linkedInSpammer.speechBubbleTimer >= window.linkedInSpammer.speechBubbleDuration) {
                window.linkedInSpammer.speechBubbleVisible = true;
                window.linkedInSpammer.speechBubbleTimer = 0;
                window.linkedInSpammer.currentQuote = (window.linkedInSpammer.currentQuote + 1) % window.linkedInSpammer.quotes.length;
            }
        } else {
            window.linkedInSpammer.speechBubbleTimer++;
            if (window.linkedInSpammer.speechBubbleTimer >= 120) { // Show speech bubble for 2 seconds
                window.linkedInSpammer.speechBubbleVisible = false;
                window.linkedInSpammer.speechBubbleTimer = 0;
            }
        }
    }
    
    // Update email icons
    if (window.emailIcons) {
        for (let i = window.emailIcons.length - 1; i >= 0; i--) {
            const emailIcon = window.emailIcons[i];
            
            // Apply gravity
            emailIcon.vy += 0.3;
            
            // Move email icon
            emailIcon.x += emailIcon.vx;
            emailIcon.y += emailIcon.vy;
            
            // Bounce off walls
            if (emailIcon.x <= 0 || emailIcon.x + emailIcon.width >= window.canvas.width) {
                emailIcon.vx *= -0.8;
                emailIcon.bounces++;
            }
            
            // Bounce off floor
            if (emailIcon.y + emailIcon.height >= window.canvas.height - 120) { // Above counter
                emailIcon.vy *= -0.8;
                emailIcon.y = window.canvas.height - 120 - emailIcon.height;
                emailIcon.bounces++;
            }
            
            // Bounce off ceiling
            if (emailIcon.y <= 0) {
                emailIcon.vy *= -0.8;
                emailIcon.y = 0;
                emailIcon.bounces++;
            }
            
            // Remove email icon if too many bounces or off screen
            if (emailIcon.bounces >= emailIcon.maxBounces || emailIcon.y > window.canvas.height) {
                window.emailIcons.splice(i, 1);
                continue;
            }
            
            // Check collision with Prompty
            if (emailIcon.x < window.prompty.x + window.prompty.width &&
                emailIcon.x + emailIcon.width > window.prompty.x &&
                emailIcon.y < window.prompty.y + window.prompty.height &&
                emailIcon.y + emailIcon.height > window.prompty.y) {
                
                // Prompty hit by email icon
                window.lives--;
                window.emailIcons.splice(i, 1);
                
                // Play hurt sound
                playTripleOuch();
                
                // Visual hurt effect
                promptyHurtTimer = 30; // 30 frames of hurt effect
                
                if (window.lives <= 0) {
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Update UI
    updateUI();
    
    // Draw everything
    draw();
    
    // Check for timeout (if update takes more than 16ms, something is wrong)
    if (Date.now() - startTime > 16) {
        console.warn('Update function taking too long:', Date.now() - startTime, 'ms');
    }
    
    // Continue loop - only if we're still in playing state
    if (window.gameState === 'playing') {
        window.gameLoop = requestAnimationFrame(update);
    } else {
        console.log('Game loop stopped - gameState:', window.gameState);
    }
} catch (error) {
    console.error('CRASH in update function at:', error.stack);
    console.error('Error details:', error.message);
    console.error('Karen state at crash:', karen);
    console.error('Karen lasers count:', karenLasers ? karenLasers.length : 'undefined');
    
    // Try to recover by going to start menu
    try {
        console.log('Attempting to recover to start menu...');
        showStartMenu();
    } catch (recoveryError) {
        console.error('Recovery failed:', recoveryError);
    }
    return;
}
}

// Main game loop with performance monitoring and safety measures
function gameLoop() {
    try {
        const startTime = performance.now();
        
        // Safety check to prevent infinite loops
        if (!window.gameState || window.gameState === 'gameOver' || window.gameState === 'levelComplete') {
            return;
        }
        
        // Update performance metrics
        window.performanceMetrics.frameCount++;
        const currentTime = performance.now();
        const frameTime = currentTime - window.performanceMetrics.lastFrameTime;
        window.performanceMetrics.lastFrameTime = currentTime;
        
        // Calculate average FPS
        if (window.performanceMetrics.frameCount % 60 === 0) {
            window.performanceMetrics.averageFPS = Math.round(1000 / (frameTime || 16.67));
        }
        
        // Memory cleanup every 300 frames (5 seconds at 60fps)
        if (window.performanceMode.enableMemoryCleanup && window.performanceMetrics.frameCount % 300 === 0) {
            performMemoryCleanup();
        }
        
        // Frame rate limiting if performance is poor
        if (window.performanceMode.enableFrameRateLimiting && window.performanceMetrics.averageFPS < 30) {
            // Skip some updates to maintain performance
            if (window.performanceMetrics.frameCount % 2 === 0) {
                window.gameLoop = requestAnimationFrame(gameLoop);
                return;
            }
        }
        
        // Safety timeout - if update takes too long, skip it
        const updateStartTime = performance.now();
        
        // Update game state
        update();
        
        // Check if update took too long
        const updateTime = performance.now() - updateStartTime;
        if (updateTime > 16.67) { // More than 60fps target
            console.warn('Update took too long:', updateTime.toFixed(2), 'ms');
        }
        
        // Draw everything
        draw();
        
        // Performance warning if frame takes too long
        const totalFrameTime = performance.now() - startTime;
        if (totalFrameTime > 16.67) { // More than 60fps target
            console.warn('Frame took too long:', totalFrameTime.toFixed(2), 'ms');
        }
        
        // Continue the loop
        window.gameLoop = requestAnimationFrame(gameLoop);
    } catch (error) {
        console.error('Error in game loop:', error);
        // Fallback: restart the game
        window.gameState = 'start';
        showStartMenu();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    try {
        // Add timeout protection
        const initTimeout = setTimeout(() => {
            console.error('Game initialization timed out!');
            const startMenu = document.getElementById('startMenu');
            if (startMenu) {
                startMenu.innerHTML = `
                    <h1>🎮 Prompty Power</h1>
                    <p>Game initialization timed out. Please refresh the page.</p>
                    <button class="button" onclick="location.reload()">Reload Game</button>
                `;
            }
        }, 5000); // 5 second timeout
        
        init();
        clearTimeout(initTimeout);
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});

// Also try window.onload as fallback
window.addEventListener('load', function() {
    console.log('Window loaded, checking if game is initialized...');
    if (!window.gameState) {
        console.log('Game not initialized yet, trying to initialize...');
        try {
            // Add timeout protection
            const initTimeout = setTimeout(() => {
                console.error('Game initialization timed out on window load!');
                const startMenu = document.getElementById('startMenu');
                if (startMenu) {
                    startMenu.innerHTML = `
                        <h1>🎮 Prompty Power</h1>
                        <p>Game initialization timed out. Please refresh the page.</p>
                        <button class="button" onclick="location.reload()">Reload Game</button>
                    `;
                }
            }, 5000); // 5 second timeout
            
            init();
            clearTimeout(initTimeout);
        } catch (error) {
            console.error('Error initializing game on window load:', error);
        }
    }
});

// Expose functions to global scope for HTML button access
window.startGame = startGame;
window.resetGame = resetGame;
window.startNextLevel = startNextLevel;
window.closeFullLeaderboard = closeFullLeaderboard;

// Add event listener for reset button
document.addEventListener('DOMContentLoaded', function() {
    const resetButton = document.getElementById('resetGame');
    if (resetButton) {
        resetButton.addEventListener('click', resetGame);
        console.log('Reset button event listener added');
    } else {
        console.log('Reset button not found');
    }
}); 