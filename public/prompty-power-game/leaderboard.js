/**
 * Leaderboard Management for Prompty Power Game
 * Handles saving scores and displaying leaderboards
 */

// Leaderboard API endpoints
const LEADERBOARD_API = '/api/game/leaderboard';
const SAVE_SCORE_API = '/api/game/save-score';

// Global variables for leaderboard
let currentScore = 0;
let currentLevel = 1;
let playerName = '';

/**
 * Save player score to leaderboard
 */
async function saveScore() {
    const nameInput = document.getElementById('playerName');
    const playerName = nameInput.value.trim();
    
    if (!playerName) {
        alert('Please enter your name!');
        return;
    }
    
    if (playerName.length > 50) {
        alert('Name must be 50 characters or less!');
        return;
    }
    
    try {
        const response = await fetch(SAVE_SCORE_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                playerName: playerName,
                score: currentScore,
                level: currentLevel
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Score saved successfully:', result.score);
            showLeaderboard();
        } else {
            console.error('Failed to save score:', result.error);
            alert('Failed to save score. Please try again.');
        }
    } catch (error) {
        console.error('Error saving score:', error);
        alert('Error saving score. Please try again.');
    }
}

/**
 * Load and display top 3 scores
 */
async function loadLeaderboard() {
    try {
        const response = await fetch(`${LEADERBOARD_API}?limit=3`);
        const result = await response.json();
        
        if (result.success) {
            displayLeaderboard(result.leaderboard);
        } else {
            console.error('Failed to load leaderboard:', result.error);
        }
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

/**
 * Display leaderboard in the game
 */
function displayLeaderboard(scores) {
    const leaderboardDiv = document.getElementById('leaderboard');
    
    if (scores.length === 0) {
        leaderboardDiv.innerHTML = '<p>No scores yet. Be the first!</p>';
        return;
    }
    
    let html = '';
    scores.forEach(score => {
        const rankClass = score.rank <= 3 ? `rank${score.rank}` : '';
        html += `
            <div class="leaderboardItem ${rankClass}">
                <span class="rank">#${score.rank}</span>
                <span class="playerName">${score.player_name}</span>
                <span class="score">${score.score}</span>
                <span class="level">L${score.level}</span>
            </div>
        `;
    });
    
    leaderboardDiv.innerHTML = html;
}

/**
 * Show leaderboard section after score is saved
 */
function showLeaderboard() {
    document.getElementById('nameInputSection').style.display = 'none';
    document.getElementById('leaderboardSection').style.display = 'block';
    loadLeaderboard();
}

/**
 * Load and display full leaderboard (top 100)
 */
async function loadFullLeaderboard() {
    try {
        const response = await fetch(`${LEADERBOARD_API}?limit=100`);
        const result = await response.json();
        
        if (result.success) {
            displayFullLeaderboard(result.leaderboard);
            document.getElementById('fullLeaderboardModal').style.display = 'flex';
        } else {
            console.error('Failed to load full leaderboard:', result.error);
        }
    } catch (error) {
        console.error('Error loading full leaderboard:', error);
    }
}

/**
 * Display full leaderboard in modal
 */
function displayFullLeaderboard(scores) {
    const fullLeaderboardDiv = document.getElementById('fullLeaderboard');
    
    if (scores.length === 0) {
        fullLeaderboardDiv.innerHTML = '<p>No scores yet. Be the first!</p>';
        return;
    }
    
    let html = '';
    scores.forEach(score => {
        const rankClass = score.rank <= 3 ? `rank${score.rank}` : '';
        html += `
            <div class="fullLeaderboardItem ${rankClass}">
                <span class="rank">#${score.rank}</span>
                <span class="playerName">${score.player_name}</span>
                <span class="score">${score.score}</span>
                <span class="level">L${score.level}</span>
            </div>
        `;
    });
    
    fullLeaderboardDiv.innerHTML = html;
}

/**
 * Close full leaderboard modal
 */
function closeFullLeaderboard() {
    document.getElementById('fullLeaderboardModal').style.display = 'none';
}

/**
 * Update game over screen with current score and level
 */
function updateGameOverScreen() {
    document.getElementById('finalScore').textContent = currentScore;
    document.getElementById('finalLevel').textContent = currentLevel;
    
    // Show name input section
    document.getElementById('nameInputSection').style.display = 'block';
    document.getElementById('leaderboardSection').style.display = 'none';
    
    // Focus on name input
    const nameInput = document.getElementById('playerName');
    nameInput.focus();
    
    // Add event listeners
    document.getElementById('saveScoreBtn').onclick = saveScore;
    document.getElementById('viewAllScoresBtn').onclick = loadFullLeaderboard;
    
    // Allow Enter key to save score
    nameInput.onkeypress = function(e) {
        if (e.key === 'Enter') {
            saveScore();
        }
    };
}

// Export functions for use in other files
window.saveScore = saveScore;
window.loadLeaderboard = loadLeaderboard;
window.showLeaderboard = showLeaderboard;
window.loadFullLeaderboard = loadFullLeaderboard;
window.closeFullLeaderboard = closeFullLeaderboard;
window.updateGameOverScreen = updateGameOverScreen; 