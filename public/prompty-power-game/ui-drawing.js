/**
 * UI Drawing Functions for Prompty Power Game
 * Handles drawing of power-ups, door signs, and UI elements
 */

// Draw power-ups
function drawPowerUps() {
    for (let powerUp of powerUps) {
        // Draw power-up icon (no boxes)
        ctx.font = '40px Arial'; // Bigger font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let icon = '?';
        if (powerUp.type === 'key') {
            icon = '🔑'; // Key icon
        } else if (powerUp.type === 'package') {
            icon = '[P]'; // Package with P label
            // Draw smaller dark blue square background for package
            ctx.fillStyle = '#003366'; // Darker blue background
            const boxSize = 30; // Smaller box
            const boxX = powerUp.x + (powerUp.width - boxSize) / 2;
            const boxY = powerUp.y + (powerUp.height - boxSize) / 2;
            ctx.fillRect(boxX, boxY, boxSize, boxSize);
            // Draw white border
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.strokeRect(boxX, boxY, boxSize, boxSize);
        } else if (powerUp.type === 'coffeeCup') {
            icon = '☕'; // Coffee cup
        } else if (powerUp.type === 'oneUp') {
            icon = '💚'; // Green heart for 1up
        }
        
        // Draw hit counter
        ctx.fillStyle = '#000000'; // Black text for counter
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.hits + '/5', powerUp.x + powerUp.width - 5, powerUp.y + 5);
        
        // Draw main icon
        ctx.fillStyle = '#000000';
        if (powerUp.type === 'package') {
            ctx.font = '16px Arial'; // Much smaller font for package
            ctx.fillStyle = '#FFFFFF'; // White text on dark blue background
            // Center text in the smaller box
            const boxSize = 30;
            const boxX = powerUp.x + (powerUp.width - boxSize) / 2;
            const boxY = powerUp.y + (powerUp.height - boxSize) / 2;
            ctx.fillText(icon, boxX + boxSize / 2, boxY + boxSize / 2);
        } else {
            ctx.font = '40px Arial'; // Normal size for other power-ups
            ctx.fillText(icon, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
        }
    }
}

// Draw door sign
function drawDoorSign() {
    if (doorSign) {
        // Door position: canvas.width / 2 - 30, 5, 60, 80
        const doorX = window.canvas.width / 2 - 30;
        const doorY = 0;
        const doorWidth = 60;
        const doorHeight = 65;
        
        // Draw sign background
        ctx.fillStyle = `rgba(255, 255, 255, ${doorSign.alpha})`;
        ctx.fillRect(doorX - 10, doorY + 20, doorWidth + 20, 40); // Made taller for stacked text
        
        // Draw sign border
        ctx.strokeStyle = `rgba(0, 0, 0, ${doorSign.alpha})`;
        ctx.lineWidth = 2;
        ctx.strokeRect(doorX - 10, doorY + 20, doorWidth + 20, 40); // Made taller for stacked text
        
        // Draw sign text - stacked layout
        ctx.fillStyle = `rgba(0, 0, 0, ${doorSign.alpha})`;
        ctx.font = 'bold 10px Arial'; // Slightly smaller font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Stack "Sorry," on top of "We're Closed"
        ctx.fillText('Sorry,', doorX + doorWidth / 2, doorY + 30);
        ctx.fillText('We\'re Closed', doorX + doorWidth / 2, doorY + 45);
    }
} 