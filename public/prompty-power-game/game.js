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

// Load LinkedIn Spammer image
window.linkedInSpammerImage = new Image();
window.linkedInSpammerImage.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/linkedin-spammer.png';

// Game objects
window.prompty = {
    x: 340, // Adjusted position for smaller size
    y: 480, // Lower position with more room for wheels
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
                    window.shootCooldown = 20; // 20 frames = 0.33 seconds at 60fps (faster but controlled)
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
        
        // Mouse movement support
        let mouseX = 0;
        let mouseY = 0;
        let isMouseControlEnabled = false;
        
        // Track mouse position on canvas
        window.canvas.addEventListener('mousemove', (e) => {
            const rect = window.canvas.getBoundingClientRect();
            mouseX = e.clientX - rect.left;
            mouseY = e.clientY - rect.top;
            
            // Enable mouse control when mouse moves over canvas
            isMouseControlEnabled = true;
        });
        
        // Disable mouse control when mouse leaves canvas
        window.canvas.addEventListener('mouseleave', () => {
            isMouseControlEnabled = false;
        });
        
        // Store mouse control state globally
        window.mouseControl = {
            enabled: () => isMouseControlEnabled,
            x: () => mouseX,
            y: () => mouseY
        };
        
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
        
        // Reset Prompty position - standing behind counter
        window.prompty.x = 330; // Adjusted for smaller size
        window.prompty.y = window.canvas.height - 170; // Behind counter with wheels visible
        
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
        
        // Start game loop (prevent multiple loops)
        try {
            if (window.gameLoop) {
                console.log('Game loop already running, not starting another');
            } else {
                window.gameLoop = requestAnimationFrame(update);
                console.log('Game loop started');
            }
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
    
    // Reset all bosses
    window.karen = null;
    window.evilGoogleExec = null;
    window.linkedInSpammer = null;
    
    // Reset all boss-related arrays and timers
    window.karenLasers = [];
    window.karenSpawnTimer = 0;
    window.evilGoogleExecSpawnTimer = 0;
    window.linkedInSpammerSpawnTimer = 0;
    window.evilGoogleArrows = [];
    window.emailIcons = [];
    
    // Reset new enemies and projectiles
    window.sickEmojis = [];
    window.virusProjectiles = [];
    window.sickEmojiSpawnTimer = 0;
    
    // Reset spawn timers
    window.emojiSpawnTimer = 0;
    window.customersConverted = 0;
    
    // Reset UI timers
    window.promptyHurtTimer = 0;
    window.screenShakeTimer = 0;
    
    // Resume audio if it was stopped
    if (window.resumeAudio) {
        window.resumeAudio();
    }
    
    // Reset Prompty position
    window.prompty.x = 330; // Adjusted for smaller size
            window.prompty.y = window.canvas.height - 170; // Behind counter with wheels visible
    
    // Start game immediately
    startGame();
    
    console.log('Game reset successfully');
}

// Main game loop
function update() {
    try {
        // Stop updating if game is over
        if (window.gameState === 'gameOver') {
            return; // Don't update anything when game is over
        }
        
        // Debug: Track if multiple loops are running
        if (!window.updateCallCount) window.updateCallCount = 0;
        window.updateCallCount++;
        if (window.updateCallCount % 60 === 0) { // Every 1 second at 60fps
            console.log('🔄 Update calls in last second:', window.updateCallCount - (window.lastUpdateCount || 0), 'Lives:', window.lives, 'GameState:', window.gameState);
            window.lastUpdateCount = window.updateCallCount;
        }
        
        const startTime = Date.now();
        
        // Debug heartbeat every 10 seconds (reduced frequency)
        if (!window.lastHeartbeat) window.lastHeartbeat = startTime;
        if (startTime - window.lastHeartbeat > 10000) {
            console.log('🔥 Game loop heartbeat - still alive at', new Date().toLocaleTimeString());
            window.lastHeartbeat = startTime;
        }
        
        // Safety net disabled - was causing multiple loops
        
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
        

        
            // Update Karen lasers (only if Karen exists)
    if (window.karen) {

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
                        playSound('oof');
                        
                        // Visual hurt effect
                        window.promptyHurtTimer = 30;
                        
                        // Remove the laser that hit Prompty
                        karenLasers.splice(i, 1);
                        
                        console.log('🔥 LIVES CHECK:', window.lives, 'Lives after hit:', window.lives);
                        if (window.lives <= 0) {
                            console.log('🔥 GAME OVER TRIGGERED - Lives:', window.lives);
                            gameOver();
                            return;
                        }
                    }
                }
            }
        }
        

        
        // Movement - Shift key toggles between mouse movement and aiming
        const isShiftPressed = window.keys['Shift'] || window.keys['ShiftLeft'] || window.keys['ShiftRight'];
        
        if (window.mouseControl && window.mouseControl.enabled() && isShiftPressed) {
            // Mouse movement mode (when Shift is held)
            const targetX = window.mouseControl.x() - window.prompty.width / 2;
            const currentX = window.prompty.x;
            const distance = targetX - currentX;
            
            // Smooth movement towards mouse position
            if (Math.abs(distance) > 3) { // Dead zone to prevent jittering
                const moveSpeed = Math.min(Math.abs(distance) * 0.1, 8); // Proportional speed, max 8
                window.prompty.x += distance > 0 ? moveSpeed : -moveSpeed;
            }
            
            // Keep Prompty within canvas bounds
            window.prompty.x = Math.max(0, Math.min(window.canvas.width - window.prompty.width, window.prompty.x));
        } else {
            // Keyboard movement (arrow keys) - works when Shift not pressed or mouse not over canvas
            if (window.keys['ArrowLeft'] && window.prompty.x > 0) {
                window.prompty.x -= 5;
            }
            if (window.keys['ArrowRight'] && window.prompty.x < window.canvas.width - window.prompty.width) {
                window.prompty.x += 5;
            }
        }
        
        // Update physics
        updateHearts();
        updateCustomers();
        updateSickEmojis();
        updateVirusProjectiles();
        
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
            const shouldSpawnBoss = (window.level >= 1 && !window.karen) ||
        (window.level >= 2 && !window.karen && !window.evilGoogleExec) ||
        (window.level >= 1 && !window.karen && !window.evilGoogleExec);
        
        if (!shouldSpawnBoss) {
            spawnCustomers();
        }
        */
        
        // Always spawn customers for now since bosses are disabled
        spawnCustomers();
        emojiSpawnTimer = 0;
    } else {
        // Spawn bosses when 70% of customers are defeated (appears towards end of level)
        const remainingCustomers = window.customers.length;
        const maxCustomers = 8; // Maximum customers that can be on screen at once
        const defeatedThreshold = Math.ceil(maxCustomers * 0.7); // 70% of max customers (6 customers)
        const shouldSpawnBoss = remainingCustomers <= (maxCustomers - defeatedThreshold); // 2 or fewer remaining
        
        // BOSS CYCLING LOGIC - Cycle through bosses every level
        // Calculate which boss should spawn based on level (cycles: Karen -> Google -> LinkedIn -> Karen...)
        const bossType = ((window.level - 1) % 3) + 1; // 1=Karen, 2=Google, 3=LinkedIn
        
        // Only spawn boss if no other boss exists
        if (window.level >= 1 && shouldSpawnBoss && !window.karen && !window.evilGoogleExec && !window.linkedInSpammer) {
            
            if (bossType === 1) {
                // Spawn Karen (levels 1, 4, 7, 10...)
                if (!window.karenSpawnTimer) {
                    window.karenSpawnTimer = 180; // 3 seconds at 60fps
                } else {
                    window.karenSpawnTimer--;
                    if (window.karenSpawnTimer <= 0) {
                        spawnKaren();
                        window.karenSpawnTimer = 0;
                    }
                }
            } else if (bossType === 2) {
                // Spawn Evil Google Exec (levels 2, 5, 8, 11...)
                if (!window.evilGoogleExecSpawnTimer) {
                    window.evilGoogleExecSpawnTimer = 240; // 4 seconds at 60fps
                } else {
                    window.evilGoogleExecSpawnTimer--;
                    if (window.evilGoogleExecSpawnTimer <= 0) {
                        spawnEvilGoogleExec();
                        window.evilGoogleExecSpawnTimer = 0;
                    }
                }
            } else if (bossType === 3) {
                // Spawn LinkedIn Spammer (levels 3, 6, 9, 12...)
                if (!window.linkedInSpammerSpawnTimer) {
                    window.linkedInSpammerSpawnTimer = 120; // 2 seconds at 60fps
                } else {
                    window.linkedInSpammerSpawnTimer--;
                    if (window.linkedInSpammerSpawnTimer <= 0) {
                        spawnLinkedInSpammer();
                        window.linkedInSpammerSpawnTimer = 0;
                    }
                }
            }
        } else {
            // Reset all timers if conditions are no longer met
            if (window.karenSpawnTimer > 0) window.karenSpawnTimer = 0;
            if (window.evilGoogleExecSpawnTimer > 0) window.evilGoogleExecSpawnTimer = 0;
            if (window.linkedInSpammerSpawnTimer > 0) window.linkedInSpammerSpawnTimer = 0;
        }
    }
    
    // Spawn power-ups less frequently
    if (Math.random() < 0.001 && powerUps.length < 3) { // 0.1% chance per frame, max 3 power-ups
        spawnPowerUp();
    }
    
    // Spawn sick emojis starting at level 4
    if (window.level >= 4) {
        if (!window.sickEmojiSpawnTimer) {
            window.sickEmojiSpawnTimer = 0;
        }
        
        window.sickEmojiSpawnTimer++;
        
        // Spawn a sick emoji every 10-15 seconds (600-900 frames at 60fps)
        const spawnInterval = 600 + Math.random() * 300;
        const maxSickEmojis = Math.min(Math.floor(window.level / 4), 3); // Max 3 sick emojis
        
        if (window.sickEmojiSpawnTimer >= spawnInterval && 
            (!window.sickEmojis || window.sickEmojis.length < maxSickEmojis)) {
            spawnSickEmoji();
            window.sickEmojiSpawnTimer = 0;
        }
    }
    
    // OneUp removed - map pin now gives extra life
    
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
    if (window.karen) {
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
                        playSound('oof');
                    
                    // Visual hurt effect
                    window.promptyHurtTimer = 30;
                    
                    // Remove the laser that hit Prompty
                    karenLasers.splice(i, 1);
                    
                    if (window.lives <= 0) {
                        console.log('🔥 GAME OVER TRIGGERED - Lives:', window.lives);
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
                    // Show special message for power-ups
                    if (powerUp.type === 'speechBubble') {
                        createFloatingText('You got mentioned\nonline!', powerUp.x + powerUp.width/2, powerUp.y, '#ff6b35');
                    } else if (powerUp.type === 'mapPin') {
                        createFloatingText('You submitted a new\ndirectory listing. +1up', powerUp.x + powerUp.width/2, powerUp.y, '#ff6b35');
                    } else if (powerUp.type === 'package') {
                        createFloatingText('Prompt Reviews\ncampaign launched!', powerUp.x + powerUp.width/2, powerUp.y, '#ff6b35');
                    } else if (powerUp.type === 'key') {
                        createFloatingText('Closed for\nbusiness!', powerUp.x + powerUp.width/2, powerUp.y, '#ff6b35');
                    }
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
                const damage = heart.isPowerful ? 3 : 1; // Fire hearts do 3 damage, normal hearts do 1
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
    
    // Update Karen fade timer if defeated
    if (window.karen && window.karen.isDefeated) {
        window.karen.fadeTimer++;
    }
    
    // Update boss hit flash timers
    if (window.karen && window.karen.hitFlashTimer > 0) {
        window.karen.hitFlashTimer--;
    }
    if (window.evilGoogleExec && window.evilGoogleExec.hitFlashTimer > 0) {
        window.evilGoogleExec.hitFlashTimer--;
    }
    if (window.linkedInSpammer && window.linkedInSpammer.hitFlashTimer > 0) {
        window.linkedInSpammer.hitFlashTimer--;
    }
    
    // Check Karen collisions (RE-ENABLED WITH SIMPLE LOGIC)
    if (window.karen) {
        for (let i = hearts.length - 1; i >= 0; i--) {
            const heart = hearts[i];
            
            if (heart.x < window.karen.x + window.karen.width &&
                heart.x + heart.width > window.karen.x &&
                heart.y < window.karen.y + window.karen.height &&
                heart.y + heart.height > window.karen.y) {
                
                // Hit Karen - fire hearts do more damage
                const damage = heart.isPowerful ? 3 : 1;
                window.karen.health -= damage;
                
                // Red flash effect
                window.karen.hitFlashTimer = 10; // Flash red for 10 frames
                
                // Play boss hit sound
                playSound('bossHit');
                
                // Simple ricochet
                heart.vx *= -0.8;
                heart.vy *= -0.8;
                heart.bounces++;
                
                if (window.karen.health <= 0) {
                    // Boss defeated - with reduced animation to prevent crashes
                    window.score += 100;
                    window.customersConverted++;
                    
                    // Store boss position before nullifying
                    const bossX = window.karen.x + window.karen.width / 2;
                    const bossY = window.karen.y + window.karen.height / 2;
                    
                    // Create reduced star effects (4 explosion + 3 row = 7 total instead of 13)
                    createStarExplosion(bossX, bossY);
                    createThreeStarRow(bossX, bossY);
                    
                    // Create floating points text
                    createFloatingText('+100', bossX, bossY, '#FFD700');
                    
                    // Play victory sound
                    playSound('victory');
                    
                    // Mark boss as defeated and set health to 0 to prevent further hits
                    window.karen.isDefeated = true;
                    window.karen.health = 0;
                    window.karen.fadeTimer = 0; // Start fade-out animation

                    
                    // Clear projectiles but keep game running
                    window.hearts = [];
                    window.powerUps = [];
                    window.karenLasers = [];
                    
                    // Show level complete overlay without stopping gameplay
                    setTimeout(() => {
                        try {
                            if (window.gameState === 'playing') { // Only proceed if still in playing state
                                window.karen = null;
                                window.karenDefeated = true;
                                window.level++;
                                // Show transparent level complete message without stopping game
                                if (typeof window.showLevelCompleteOverlay === 'function') {
                                    window.showLevelCompleteOverlay();
                                } else {
                                    console.error('showLevelCompleteOverlay is not a function:', typeof window.showLevelCompleteOverlay);
                                }
                            }
                        } catch (error) {
                            console.error('Error in Karen defeat timeout:', error);
                        }
                        
                        // Safety check: ensure game loop continues after boss defeat
                        setTimeout(() => {
                            if (!window.gameLoopPending && window.gameState === 'playing') {
                                console.log('🔄 Boss defeat safety: restarting game loop');
                                window.gameLoopPending = true;
                                requestAnimationFrame(() => {
                                    window.gameLoopPending = false;
                                    update();
                                });
                            }
                        }, 100);
                    }, 500); // Reduced to 0.5s for snappier transitions
                    
                    return;
                }
                
                break;
            }
        }
    }
    
    // Update Evil Google Exec fade timer if defeated
    if (window.evilGoogleExec && window.evilGoogleExec.isDefeated) {
        window.evilGoogleExec.fadeTimer++;
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
                const damage = heart.isPowerful ? 3 : 1;
                window.evilGoogleExec.health -= damage;
                
                // Red flash effect
                window.evilGoogleExec.hitFlashTimer = 10; // Flash red for 10 frames
                
                // Play boss hit sound
                playSound('bossHit');
                
                // Simple ricochet
                heart.vx *= -0.8;
                heart.vy *= -0.8;
                heart.bounces++;
                
                if (window.evilGoogleExec.health <= 0) {
                    // Boss defeated - with reduced animation to prevent crashes
                    window.score += 100;
                    window.customersConverted++;
                    
                    // Store boss position before nullifying
                    const bossX = window.evilGoogleExec.x + window.evilGoogleExec.width / 2;
                    const bossY = window.evilGoogleExec.y + window.evilGoogleExec.height / 2;
                    
                    // Create reduced star effects (4 explosion + 3 row = 7 total instead of 13)
                    createStarExplosion(bossX, bossY);
                    createThreeStarRow(bossX, bossY);
                    
                    // Create floating points text
                    createFloatingText('+100', bossX, bossY, '#FFD700');
                    
                    // Play victory sound
                    playSound('victory');
                    
                    // Mark boss as defeated and set health to 0 to prevent further hits
                    window.evilGoogleExec.isDefeated = true;
                    window.evilGoogleExec.health = 0;
                    window.evilGoogleExec.fadeTimer = 0; // Start fade-out animation
                    
                    // Clear projectiles but keep game running
                    window.hearts = [];
                    window.powerUps = [];
                    window.evilGoogleArrows = [];
                    
                    // Show level complete overlay without stopping gameplay
                    setTimeout(() => {
                        if (window.gameState === 'playing') { // Only proceed if still in playing state
                            window.evilGoogleExec = null;
                            window.level++;
                            // Show transparent level complete message without stopping game
                            showLevelCompleteOverlay();
                        }
                        
                        // Safety check: ensure game loop continues after boss defeat
                        setTimeout(() => {
                            if (!window.gameLoopPending && window.gameState === 'playing') {
                                console.log('🔄 Boss defeat safety: restarting game loop');
                                window.gameLoopPending = true;
                                requestAnimationFrame(() => {
                                    window.gameLoopPending = false;
                                    update();
                                });
                            }
                        }, 100);
                    }, 500); // Reduced to 0.5s for snappier transitions
                    
                    return;
                }
                
                break;
            }
        }
    }
    
    // Update LinkedIn Spammer fade timer if defeated
    if (window.linkedInSpammer && window.linkedInSpammer.isDefeated) {
        window.linkedInSpammer.fadeTimer++;
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
            const damage = heart.isPowerful ? 3 : 1; // Fire hearts do 3 damage, normal hearts do 1
            window.linkedInSpammer.health -= damage;
            
            // Red flash effect
            window.linkedInSpammer.hitFlashTimer = 10; // Flash red for 10 frames
            
            // Play boss hit sound
            playSound('bossHit');
            
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
                // Boss defeated - with reduced animation to prevent crashes
                window.score += 100;
                window.customersConverted++;
                
                // Store boss position before nullifying
                const bossX = window.linkedInSpammer.x + window.linkedInSpammer.width / 2;
                const bossY = window.linkedInSpammer.y + window.linkedInSpammer.height / 2;
                
                // Create reduced star effects (4 explosion + 3 row = 7 total instead of 13)
                createStarExplosion(bossX, bossY);
                createThreeStarRow(bossX, bossY);
                
                // Create floating points text
                createFloatingText('+100', bossX, bossY, '#FFD700');
                
                // Mark boss as defeated and set health to 0 to prevent further hits
                window.linkedInSpammer.isDefeated = true;
                window.linkedInSpammer.health = 0;
                window.linkedInSpammer.fadeTimer = 0; // Start fade-out animation
                
                // Clear projectiles but keep game running
                window.hearts = [];
                window.powerUps = [];
                window.emailIcons = [];
                
                // Show level complete overlay without stopping gameplay
                setTimeout(() => {
                    if (window.gameState === 'playing') { // Only proceed if still in playing state
                        window.linkedInSpammer = null;
                        window.level++;
                        // Show transparent level complete message without stopping game
                        showLevelCompleteOverlay();
                    }
                    
                    // Safety check: ensure game loop continues after boss defeat
                    setTimeout(() => {
                        if (!window.gameLoopPending && window.gameState === 'playing') {
                            console.log('🔄 Boss defeat safety: restarting game loop');
                            window.gameLoopPending = true;
                            requestAnimationFrame(() => {
                                window.gameLoopPending = false;
                                update();
                            });
                        }
                    }, 100);
                }, 500); // Reduced to 0.5s for snappier transitions
                
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

    
    // Update Karen boss (RE-ENABLED WITH SIMPLE LOGIC)
    if (window.karen) {
        // Move Karen side to side
        const karenSpeed = 1.5 + (Math.min(window.level, 10) * 0.2); // Slower base speed, capped at level 10
        window.karen.x += karenSpeed * window.karen.direction;
        
        // Bounce off walls
        if (window.karen.x <= 50 || window.karen.x >= window.canvas.width - 150) {
            window.karen.direction *= -1;
        }
        
        // Simple speech bubble timing
        if (!window.karen.speechBubbleTimer) window.karen.speechBubbleTimer = 0;
        window.karen.speechBubbleTimer++;
        
        if (window.karen.speechBubbleTimer > 120) { // Show speech bubble every 2 seconds
            window.karen.speechBubbleVisible = !window.karen.speechBubbleVisible;
            window.karen.speechBubbleTimer = 0;
        }
        
        // Change quote every 8 seconds
        if (!window.karen.quoteChangeTimer) window.karen.quoteChangeTimer = 0;
        window.karen.quoteChangeTimer++;
        if (window.karen.quoteChangeTimer > 480) { // 8 seconds
            const karenQuotes = [
                "You just lost a star, sweetie.",
                "Your tone is very aggressive.",
                "This is unacceptable — I demand a refund.",
                "You think I'm racist?"
            ];
            window.karen.currentQuote = karenQuotes[Math.floor(Math.random() * karenQuotes.length)];
            window.karen.quoteChangeTimer = 0;
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
        const execSpeed = 1.0 + (Math.min(window.level, 10) * 0.15); // Slower base speed, capped at level 10
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
                "Is being Evil really so bad?",
                "Welcome to zero-click search results!"
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
                
                // Check collision with tables
                const tables = [
                    {x: 150, y: window.canvas.height - 280, width: 80, height: 60},
                    {x: 550, y: window.canvas.height - 280, width: 80, height: 60},
                    {x: 350, y: window.canvas.height - 330, width: 80, height: 60}
                ];
                
                let hitTable = false;
                for (let table of tables) {
                    if (arrow.x < table.x + table.width &&
                        arrow.x + arrow.width > table.x &&
                        arrow.y < table.y + table.height &&
                        arrow.y + arrow.height > table.y) {
                        
                        // Arrow hits table - remove it
                        window.evilGoogleArrows.splice(i, 1);
                        hitTable = true;
                        
                        // Play impact sound
                        playSound('bounce');
                        
                        // Create visual feedback
                        createFloatingText(arrow.x, arrow.y, 'BLOCKED!', '#ffaa00');
                        
                        break;
                    }
                }
                
                if (hitTable) continue; // Skip to next arrow if this one hit a table
                
                // Remove arrows that are off screen or expired
                if (arrow.y > window.canvas.height || arrow.life <= 0) {
                    window.evilGoogleArrows.splice(i, 1);
                    continue;
                }
                
                // Check collision with Prompty
                if (arrow.x < window.prompty.x + window.prompty.width &&
                    arrow.x + arrow.width > window.prompty.x &&
                    arrow.y < window.prompty.y + window.prompty.height &&
                    arrow.y + arrow.height > window.prompty.y) {
                    
                    // Prompty gets hit by arrow
                    window.lives--;
                        playSound('oof');
                    playTripleOuch();
                    
                    // Visual hurt effect
                    window.promptyHurtTimer = 30;
                    
                    // Remove the arrow
                    window.evilGoogleArrows.splice(i, 1);
                    
                    if (window.lives <= 0) {
                        console.log('🔥 GAME OVER TRIGGERED - Lives:', window.lives);
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
        // Note: LinkedIn Spammer defeat is now handled in the collision detection section above
        // This section only handles movement and behavior while alive
        
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
            const throwVx = (Math.random() - 0.5) * 5; // Slower horizontal velocity (reduced from 8 to 5)
            const throwVy = 3 + Math.random() * 2; // Slower downward velocity (reduced from 5-8 to 3-5)
            
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
            if (emailIcon.y + emailIcon.height >= window.canvas.height - 110) { // Above counter
                emailIcon.vy *= -0.8;
                emailIcon.y = window.canvas.height - 110 - emailIcon.height;
                emailIcon.bounces++;
            }
            
            // Bounce off ceiling
            if (emailIcon.y <= 0) {
                emailIcon.vy *= -0.8;
                emailIcon.y = 0;
                emailIcon.bounces++;
            }
            
            // Check collision with tables
            const tables = [
                {x: 150, y: window.canvas.height - 280, width: 80, height: 60},
                {x: 550, y: window.canvas.height - 280, width: 80, height: 60},
                {x: 350, y: window.canvas.height - 330, width: 80, height: 60}
            ];
            
            for (let table of tables) {
                if (emailIcon.x < table.x + table.width &&
                    emailIcon.x + emailIcon.width > table.x &&
                    emailIcon.y < table.y + table.height &&
                    emailIcon.y + emailIcon.height > table.y) {
                    
                    // Calculate overlap distances for accurate collision response
                    const overlapLeft = (emailIcon.x + emailIcon.width) - table.x;
                    const overlapRight = (table.x + table.width) - emailIcon.x;
                    const overlapTop = (emailIcon.y + emailIcon.height) - table.y;
                    const overlapBottom = (table.y + table.height) - emailIcon.y;
                    
                    // Find the smallest overlap to determine collision side
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    // Bounce based on the smallest overlap
                    if (minOverlap === overlapLeft && emailIcon.vx > 0) {
                        emailIcon.vx = -Math.abs(emailIcon.vx) * 0.8;
                        emailIcon.x = table.x - emailIcon.width - 1;
                        emailIcon.bounces++;
                        playSound('bounce');
                    } else if (minOverlap === overlapRight && emailIcon.vx < 0) {
                        emailIcon.vx = Math.abs(emailIcon.vx) * 0.8;
                        emailIcon.x = table.x + table.width + 1;
                        emailIcon.bounces++;
                        playSound('bounce');
                    } else if (minOverlap === overlapTop && emailIcon.vy > 0) {
                        emailIcon.vy = -Math.abs(emailIcon.vy) * 0.8;
                        emailIcon.y = table.y - emailIcon.height - 1;
                        emailIcon.bounces++;
                        playSound('bounce');
                    } else if (minOverlap === overlapBottom && emailIcon.vy < 0) {
                        emailIcon.vy = Math.abs(emailIcon.vy) * 0.8;
                        emailIcon.y = table.y + table.height + 1;
                        emailIcon.bounces++;
                        playSound('bounce');
                    }
                    break;
                }
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
                        playSound('oof');
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
    
        // Continue loop only if game is not over
        if (window.gameState !== 'gameOver') {
            requestAnimationFrame(update);
        } else {
            console.log('🛑 Game loop stopped - game is over');
        }
    } catch (error) {
        console.error('💥 CRASH in update function at:', error.stack);
        console.error('💥 Error details:', error.message);
        console.error('💥 Karen state at crash:', window.karen);
        console.error('💥 Karen lasers count:', window.karenLasers ? window.karenLasers.length : 'undefined');
        
        // CRITICAL: Restart loop even if there's an error (but only if game not over)
        if (window.gameState !== 'gameOver') {
            console.log('🔄 Restarting game loop after error...');
            setTimeout(() => {
                if (!window.gameLoopPending && window.gameState !== 'gameOver') {
                    window.gameLoopPending = true;
                    requestAnimationFrame(() => {
                        window.gameLoopPending = false;
                        update();
                    });
                }
            }, 100);
        } else {
            console.log('🛑 Not restarting game loop - game is over');
        }
    }
}

// Main game loop with performance monitoring and safety measures
function gameLoop() {
    try {
        const startTime = performance.now();
        
        // Safety check to prevent infinite loops during game over only
        if (window.gameState === 'gameOver') {
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
        
        // Frame rate limiting disabled - was causing erratic timing and speed issues
        
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
        
        // Continue the loop (only if not already running)
        if (!window.gameLoopPending) {
            window.gameLoopPending = true;
            window.gameLoop = requestAnimationFrame(() => {
                window.gameLoopPending = false;
                update();
            });
        }
    } catch (error) {
        console.error('💥 Error in game loop:', error);
        console.error('💥 Game loop error details:', error.message);
        console.error('💥 Game loop error stack:', error.stack);
        console.error('💥 Game state at game loop error:', window.gameState);
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