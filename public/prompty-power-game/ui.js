/**
 * UI Management for Prompty Power Game
 * Handles screen transitions, UI updates, and game state management
 */

// Screen management
function showScreen(screenName) {
    console.log('showScreen called with:', screenName);
    
    try {
        // Hide all screens
        const startMenu = document.getElementById('startMenu');
        const gameOver = document.getElementById('gameOver');
        const levelComplete = document.getElementById('levelComplete');
        const powerUpStatus = document.getElementById('powerUpStatus');
        
        console.log('Found elements - startMenu:', startMenu, 'gameOver:', gameOver, 'levelComplete:', levelComplete, 'powerUpStatus:', powerUpStatus);
        
        if (startMenu) startMenu.style.display = 'none';
        if (gameOver) gameOver.style.display = 'none';
        if (levelComplete) levelComplete.style.display = 'none';
        if (powerUpStatus) powerUpStatus.style.display = 'none';
        
        console.log('All screens hidden');
        
        // Show the requested screen
        if (screenName === 'startMenu') {
            if (startMenu) {
                startMenu.style.display = 'block';
                console.log('Start menu shown');
            }
        } else if (screenName === 'gameOver') {
            if (gameOver) {
                gameOver.style.display = 'flex';
                console.log('Game over screen shown');
            }
        } else if (screenName === 'levelComplete') {
            if (levelComplete) {
                levelComplete.style.display = 'block';
                console.log('Level complete screen display set to block');
            } else {
                console.error('Level complete element not found!');
            }
        }
        
        console.log('Screen visibility updated for:', screenName);
    } catch (error) {
        console.error('Error in showScreen:', error);
    }
}

function showStartMenu() {
    console.log('showStartMenu called');
    window.gameState = 'start';
    document.getElementById('startMenu').style.display = 'block';
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('levelComplete').style.display = 'none';
    document.getElementById('powerUpStatus').style.display = 'none';
    console.log('Start menu should be visible now');
}

function showLevelComplete() {
    try {
        const completedLevelElement = document.getElementById('completedLevel');
        const levelScoreElement = document.getElementById('levelScore');
        
        if (completedLevelElement) {
            completedLevelElement.textContent = window.level;
        }
        if (levelScoreElement) {
            levelScoreElement.textContent = window.score;
        }
        
        showScreen('levelComplete');
    } catch (error) {
        console.error('Error in showLevelComplete:', error);
        // Fallback: show start menu
        showStartMenu();
    }
}

// Show level complete overlay without stopping gameplay
window.showLevelCompleteOverlay = function showLevelCompleteOverlay() {
    try {
        // Initialize overlay variables if they don't exist
        if (!window.levelCompleteOverlay) {
            window.levelCompleteOverlay = {
                visible: false,
                timer: 0,
                duration: 180, // 3 seconds at 60fps
                alpha: 0
            };
        }
        
        // Show the overlay
        window.levelCompleteOverlay.visible = true;
        window.levelCompleteOverlay.timer = 0;
        window.levelCompleteOverlay.alpha = 0.9; // Semi-transparent
        
        // Auto-hide after duration
        setTimeout(() => {
            if (window.levelCompleteOverlay) {
                window.levelCompleteOverlay.visible = false;
            }
        }, 3000); // Hide after 3 seconds
        
        // Level complete overlay setup completed
    } catch (error) {
        console.error('Error in showLevelCompleteOverlay:', error);
    }
};

function startNextLevel() {
    console.log('🚨 UNEXPECTED: startNextLevel called - Starting level:', window.level);
    console.trace('startNextLevel call stack:');
    
    // Hide level complete screen
    const levelCompleteElement = document.getElementById('levelComplete');
    if (levelCompleteElement) {
        levelCompleteElement.style.display = 'none';
    } else {
        console.error('Level complete element not found!');
    }
    
    // Note: Using simplified game loop that doesn't need cancellation
    
    // Reset game state for next level
    window.gameState = 'playing';
    
    window.hearts = [];
    window.customers = [];
    window.powerUps = [];
    window.stars = [];
    window.karen = null;
    window.karenLasers = [];
    window.doorSign = null; // Clear door sign
    window.levelUpTextVisible = false; // Clear level up text
    window.levelUpDisplayTimer = 0; // Reset level up timer
    
    // Reset Karen spawn timer
    window.karenSpawnTimer = 0;
    
    // Reset Evil Google Exec spawn timer
    window.evilGoogleExecSpawnTimer = 0;
    

    
    // Reset floating texts
    window.floatingTexts = [];
    
    // Reset Prompty position
    window.prompty.x = 330;
            window.prompty.y = window.canvas.height - 170; // Lower position with wheels visible
    
    // Reset combo system
    window.comboCount = 0;
    window.comboMultiplier = 1;
    window.lastHitTime = 0;
    
    // Reset screen shake
    window.screenShakeX = 0;
    window.screenShakeY = 0;
    window.screenShakeTimer = 0;
    
    // Reset active power-ups
    for (let powerUpType in window.activePowerUps) {
        window.activePowerUps[powerUpType].active = false;
        window.activePowerUps[powerUpType].timer = 0;
    }
    
    // Set level start time
    window.levelStartTime = Date.now();
    
    // Reset customer death counter for new level
    window.customersConverted = 0;
    
    // Reset level completion timer for new level
    window.levelCompleteTimer = 0;
    
    // Spawn customers for next level (escalate by 30% each level)
    const baseCustomerCount = 10;
    const customerCount = Math.min(Math.floor(baseCustomerCount * Math.pow(1.3, window.level - 1)), 50); // 30% increase per level, max 50
    for (let k = 0; k < customerCount; k++) {
        setTimeout(() => spawnCustomers(), k * 600); // Faster spawning
    }
    
    // Game loop already running - no need to restart it
    console.log('Next level started - Level:', window.level, 'Game state:', window.gameState);
}

function gameOver() {
    window.gameState = 'gameOver';
    
    // Play game over sound
    playSound('gameOver');
    
    // Update leaderboard variables
    currentScore = window.score;
    currentLevel = window.level;
    
    // Set game over message based on level
    const gameOverMessageElement = document.getElementById('gameOverMessage');
    let message = '';
    
    if (window.level <= 2) {
        message = 'You failed to get enough reviews to get found online. :(';
    } else if (window.level <= 5) {
        message = 'Not bad. You got enough reviews to boost your rankings!';
    } else if (window.level <= 10) {
        message = 'Your customers are picking up what your putting down!';
    } else {
        message = 'Has anyone ever told you, you\'re a marketing god!';
    }
    
    if (gameOverMessageElement) {
        gameOverMessageElement.innerHTML = `<p>${message}</p>`;
    }
    
    // Update game over screen with leaderboard functionality
    updateGameOverScreen();
    
    showScreen('gameOver');
}

// Update UI elements
function updateUI() {
    // Update performance panel

    
    // Update score display
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = window.score;
    }
    
    // Update lives display
    const livesElement = document.getElementById('lives');
    if (livesElement) {
        livesElement.textContent = window.lives;
    }
    
    // Update level display
    const levelElement = document.getElementById('level');
    if (levelElement) {
        levelElement.textContent = window.level;
    }
    
    // Update combo display
    const comboElement = document.getElementById('combo');
    if (comboElement) {
        comboElement.textContent = window.comboCount;
    }
} 

function updateGameOverScreen() {
    const finalScoreElement = document.getElementById('finalScore');
    const finalLevelElement = document.getElementById('finalLevel');
    const nameInputSection = document.getElementById('nameInputSection');
    const leaderboardSection = document.getElementById('leaderboardSection');
    
    if (finalScoreElement) finalScoreElement.textContent = currentScore;
    if (finalLevelElement) finalLevelElement.textContent = currentLevel;
    
    // Show name input section first
    if (nameInputSection) nameInputSection.style.display = 'block';
    if (leaderboardSection) leaderboardSection.style.display = 'none';
    
    // Load and display leaderboard
    loadLeaderboard();
} 

// Boss popup functionality
function showBossPopup(bossType) {
    const popup = document.getElementById('bossPopup');
    const image = document.getElementById('bossPopupImage');
    const title = document.getElementById('bossPopupTitle');
    const description = document.getElementById('bossPopupDescription');
    const abilitiesList = document.getElementById('bossPopupAbilitiesList');
    
    const bossData = {
        karen: {
            title: 'Evil Karen',
            image: 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/evil-karen.png',
            description: 'The classic entitled customer who demands to speak to the manager in order to feel important. She traumatizes minimum wage workers and leaves destruction in her wake.',
            abilities: [
                'Shoots laser beams from her eyes',
                'Moves back and forth across the screen',
                'Has a health bar that must be depleted',
                'Creates ricochet combos when hit',
                'Is racist'
            ]
        },
        evilGoogleExec: {
            title: 'Evil Google Exec',
            image: 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/evil-google-exec.png',
            description: 'A ruthless executive who wants to bury your business in search results if you don\'t pay for overpriced ads designed to max-out your marketing spend.',
            abilities: [
                'Shoots traffic down arrows',
                'Moves back and forth across the screen',
                'Has a health bar that must be depleted',
                'Creates ricochet combos when hit',
                'Is terrified of OpenAI'
            ]
        },
        linkedInSpammer: {
            title: 'Evil LinkedIn Spammer',
            image: 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/linkedin-spammer.png',
            description: 'Relentless in his pursuit to deliver "8–10 new leads a month," Evil LinkedIn Spammer weaponizes automation and marketing acronyms to lure unsuspecting victims into his sales funnel of doom.',
            abilities: [
                'Launches bouncing emails at Prompty',
                'Moves back and forth across the screen',
                'Has a health bar that must be depleted',
                'Bumps messages to the top of your inbox'
            ]
        }
    };
    
    const boss = bossData[bossType];
    
    // Set popup content
    image.style.backgroundImage = `url('${boss.image}')`;
    title.textContent = boss.title;
    description.textContent = boss.description;
    
    // Clear and populate abilities list
    abilitiesList.innerHTML = '';
    boss.abilities.forEach(ability => {
        const li = document.createElement('li');
        li.textContent = ability;
        abilitiesList.appendChild(li);
    });
    
    // Show popup
    popup.style.display = 'flex';
}

function hideBossPopup() {
    const popup = document.getElementById('bossPopup');
    popup.style.display = 'none';
}

// Close popup when clicking outside
document.addEventListener('click', function(event) {
    const popup = document.getElementById('bossPopup');
    const popupContent = document.querySelector('.bossPopupContent');
    
    if (event.target === popup) {
        hideBossPopup();
    }
}); 

 