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
            // No background or border - just the text
        } else if (powerUp.type === 'speechBubble') {
            icon = '💬'; // Speech bubble
        } else if (powerUp.type === 'mapPin') {
            icon = '📍'; // Map pin
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
            // Draw slate blue background square with rounded corners for [P] power-up
            const squareSize = 32; // Size of the square
            const squareX = powerUp.x + powerUp.width / 2 - squareSize / 2;
            const squareY = powerUp.y + powerUp.height / 2 - squareSize / 2;
            const cornerRadius = 4; // Slightly rounded corners
            
            // Draw rounded rectangle background
            ctx.fillStyle = '#475569'; // Slate blue color
            ctx.beginPath();
            ctx.moveTo(squareX + cornerRadius, squareY);
            ctx.lineTo(squareX + squareSize - cornerRadius, squareY);
            ctx.quadraticCurveTo(squareX + squareSize, squareY, squareX + squareSize, squareY + cornerRadius);
            ctx.lineTo(squareX + squareSize, squareY + squareSize - cornerRadius);
            ctx.quadraticCurveTo(squareX + squareSize, squareY + squareSize, squareX + squareSize - cornerRadius, squareY + squareSize);
            ctx.lineTo(squareX + cornerRadius, squareY + squareSize);
            ctx.quadraticCurveTo(squareX, squareY + squareSize, squareX, squareY + squareSize - cornerRadius);
            ctx.lineTo(squareX, squareY + cornerRadius);
            ctx.quadraticCurveTo(squareX, squareY, squareX + cornerRadius, squareY);
            ctx.closePath();
            ctx.fill();
            
            // Draw white [P] text on the background
            ctx.font = '18px Arial Bold'; // Adjusted font size for better fit
            ctx.fillStyle = '#FFFFFF'; // White text
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, powerUp.x + powerUp.width / 2, powerUp.y + powerUp.height / 2);
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

// Draw shift mode indicator
function drawShiftModeIndicator() {
    if (!window.ctx || !window.keys) return;
    
    const isShiftPressed = window.keys['Shift'] || window.keys['ShiftLeft'] || window.keys['ShiftRight'];
    const mouseInCanvas = window.mouseControl && window.mouseControl.enabled();
    
    if (isShiftPressed && mouseInCanvas) {
        // Draw indicator in top-left corner
        window.ctx.save();
        
        // Background
        window.ctx.fillStyle = 'rgba(100, 255, 100, 0.8)';
        window.ctx.fillRect(10, 10, 150, 30);
        
        // Border
        window.ctx.strokeStyle = '#00ff00';
        window.ctx.lineWidth = 2;
        window.ctx.strokeRect(10, 10, 150, 30);
        
        // Text
        window.ctx.fillStyle = '#000000';
        window.ctx.font = 'bold 12px Arial';
        window.ctx.textAlign = 'center';
        window.ctx.textBaseline = 'middle';
        window.ctx.fillText('⇧ MOUSE MOVE MODE', 85, 25);
        
        window.ctx.restore();
    }
} 