/**
 * Drawing System for Prompty Power Game
 * Handles all visual rendering and drawing functions
 */

// Canvas and context - make global for access from other files
window.canvas = null;
window.ctx = null;

// Initialize canvas and context
function initCanvas() {
    console.log('initCanvas called, looking for gameCanvas element...');
    window.canvas = document.getElementById('gameCanvas');
    if (!window.canvas) {
        console.error('Canvas element not found! Make sure element with id="gameCanvas" exists');
        return false;
    }
    
    console.log('Canvas element found, getting 2D context...');
    window.ctx = window.canvas.getContext('2d');
    if (!window.ctx) {
        console.error('Canvas context not available! This might be due to iframe restrictions');
        return false;
    }
    
    console.log('Canvas initialized successfully:', window.canvas.width, 'x', window.canvas.height);
    return true;
}

// Add roundRect polyfill for speech bubble
function setupRoundRect() {
    if (window.ctx && !window.ctx.roundRect) {
        window.ctx.roundRect = function(x, y, width, height, radius) {
            this.beginPath();
            this.moveTo(x + radius, y);
            this.lineTo(x + width - radius, y);
            this.quadraticCurveTo(x + width, y, x + width, y + radius);
            this.lineTo(x + width, y + height - radius);
            this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
            this.lineTo(x + radius, y + height);
            this.quadraticCurveTo(x, y + height, x, y + height - radius);
            this.lineTo(x, y + radius);
            this.quadraticCurveTo(x, y, x + radius, y);
            this.closePath();
        };
    }
}

// Draw a star shape
function drawStar(ctx, centerX, centerY, radius, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let step = Math.PI / spikes;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        const outerX = Math.cos(rot) * outerRadius + centerX;
        const outerY = Math.sin(rot) * outerRadius + centerY;
        ctx.lineTo(outerX, outerY);
        rot += step;
        
        const innerX = Math.cos(rot) * innerRadius + centerX;
        const innerY = Math.sin(rot) * innerRadius + centerY;
        ctx.lineTo(innerX, innerY);
        rot += step;
    }
    
    ctx.closePath();
}

// Draw background
function drawBackground() {
    // Back wall - make it shorter
    window.ctx.fillStyle = '#5F9EA0'; // Slate blue
    window.ctx.fillRect(0, 0, window.canvas.width, 65); // Wall lowered by 15px (was 80, now 65)
    
    // Cafe background - start from lower position
    const gradient = window.ctx.createLinearGradient(0, 65, 0, window.canvas.height); // Start from 65 (was 80)
    gradient.addColorStop(0, '#DEB887'); // Light brown
    gradient.addColorStop(1, '#F5DEB3'); // Wheat
    window.ctx.fillStyle = gradient;
    window.ctx.fillRect(0, 65, window.canvas.width, window.canvas.height - 65); // Adjusted Y and height
    
    // Main cafe wall - adjusted for new wall height
    window.ctx.fillStyle = '#DEB887'; // Light brown
    window.ctx.fillRect(0, 65, window.canvas.width, window.canvas.height - 145); // Adjusted Y and height
    
    // Door - positioned on the shorter wall
    if (doorIsOpen) {
        window.ctx.fillStyle = '#000000'; // Black when open
    } else {
        window.ctx.fillStyle = '#8B4513'; // Brown when closed
    }
    window.ctx.fillRect(window.canvas.width / 2 - 30, 0, 60, 65); // Door now starts at y=0 and matches wall height
    
    // Windows - positioned on the shorter wall
    window.ctx.fillStyle = '#87CEEB'; // Sky blue
    window.ctx.fillRect(100, 10, 40, 50); // Adjusted for shorter wall
    window.ctx.fillRect(window.canvas.width - 140, 10, 40, 50); // Adjusted for shorter wall
    
    // Window frames
    window.ctx.strokeStyle = '#8B4513';
    window.ctx.lineWidth = 3;
    window.ctx.strokeRect(100, 10, 40, 50);
    window.ctx.strokeRect(window.canvas.width - 140, 10, 40, 50);
    
    // Window panes
    window.ctx.strokeStyle = '#FFFFFF';
    window.ctx.lineWidth = 1;
    window.ctx.beginPath();
    window.ctx.moveTo(120, 10);
    window.ctx.lineTo(120, 60);
    window.ctx.moveTo(100, 35);
    window.ctx.lineTo(140, 35);
    window.ctx.stroke();
    
    window.ctx.beginPath();
    window.ctx.moveTo(window.canvas.width - 120, 10);
    window.ctx.lineTo(window.canvas.width - 120, 60);
    window.ctx.moveTo(window.canvas.width - 140, 35);
    window.ctx.lineTo(window.canvas.width - 100, 35);
    window.ctx.stroke();
    
    // Counter where Prompty stands
    window.ctx.fillStyle = '#8B4513';
    window.ctx.fillRect(0, window.canvas.height - 100, window.canvas.width, 20); // Moved down 20px
    
    // Counter top
    window.ctx.fillStyle = '#DEB887';
    window.ctx.fillRect(0, window.canvas.height - 100, window.canvas.width, 5); // Moved down 20px
    
    // Cafe decorations
    // Coffee cups on counter - proper brown cups
    window.ctx.fillStyle = '#8B4513'; // Brown cup color
    window.ctx.fillRect(50, window.canvas.height - 110, 15, 20); // Moved down 20px
    window.ctx.fillRect(100, window.canvas.height - 110, 15, 20); // Moved down 20px
    window.ctx.fillRect(150, window.canvas.height - 110, 15, 20); // Moved down 20px
    
    // Coffee cup handles
    window.ctx.strokeStyle = '#654321';
    window.ctx.lineWidth = 2;
    window.ctx.beginPath();
    window.ctx.arc(65, window.canvas.height - 100, 5, 0, Math.PI, true); // Moved down 20px
    window.ctx.stroke();
    window.ctx.beginPath();
    window.ctx.arc(115, window.canvas.height - 100, 5, 0, Math.PI, true); // Moved down 20px
    window.ctx.stroke();
    window.ctx.beginPath();
    window.ctx.arc(165, window.canvas.height - 100, 5, 0, Math.PI, true); // Moved down 20px
    window.ctx.stroke();
    
    // Tables for hearts to bounce off - moved farther from Prompty
    window.ctx.fillStyle = '#8B4513';
    window.ctx.fillRect(150, window.canvas.height - 280, 80, 60); // Table 1 - left side (moved down 20px)
    window.ctx.fillRect(550, window.canvas.height - 280, 80, 60); // Table 2 - right side (moved down 20px)
    window.ctx.fillRect(350, window.canvas.height - 330, 80, 60); // Table 3 - center back (moved down 20px)
    
    // Table tops
    window.ctx.fillStyle = '#DEB887';
    window.ctx.fillRect(145, window.canvas.height - 285, 90, 10);
    window.ctx.fillRect(545, window.canvas.height - 285, 90, 10);
    window.ctx.fillRect(345, window.canvas.height - 335, 90, 10);
}

// Draw customers
function drawCustomers() {
    for (let customer of customers) {
        // Draw emoji
        window.ctx.font = '30px Arial';
        window.ctx.textAlign = 'center';
        window.ctx.textBaseline = 'middle';
        
        // Special styling for speed demons
        if (customer.isSpeedDemon) {
            // Add red glow effect for speed demons
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FF0000';
            window.ctx.globalAlpha = 0.6;
            window.ctx.beginPath();
            window.ctx.arc(customer.x + customer.width / 2, customer.y + customer.height / 2, 25, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
        }
        
        window.ctx.fillText(customerEmojis[customer.emojiIndex], customer.x + customer.width / 2, customer.y + customer.height / 2);
    }
}

// Draw hearts
function drawHearts() {
    for (let heart of hearts) {
        // Calculate fade effect for hearts near max bounces
        const fadeAlpha = heart.bounces >= heart.maxBounces - 1 ? 0.5 : 1.0;
        
        // Add fire effect for powerful hearts (draw first so heart appears on top)
        if (heart.isPowerful) {
            // Bright outer glow effect
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FF0000'; // Bright red
            window.ctx.globalAlpha = 0.8;
            window.ctx.beginPath();
            window.ctx.arc(heart.x + heart.width / 2, heart.y + heart.height / 2, 30, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
            
            // Orange fire glow
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FF8C00'; // Dark orange
            window.ctx.globalAlpha = 0.9;
            window.ctx.beginPath();
            window.ctx.arc(heart.x + heart.width / 2, heart.y + heart.height / 2, 25, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
            
            // Yellow core glow
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FFFF00'; // Bright yellow
            window.ctx.globalAlpha = 1.0;
            window.ctx.beginPath();
            window.ctx.arc(heart.x + heart.width / 2, heart.y + heart.height / 2, 20, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
            
            // Animated fire particles (more and brighter)
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            for (let i = 0; i < 6; i++) { // More particles
                const angle = (Date.now() / 80 + i * 60) * Math.PI / 180; // Faster rotation
                const radius = 20 + Math.sin(Date.now() / 150) * 8; // Larger radius
                const px = heart.x + heart.width / 2 + Math.cos(angle) * radius;
                const py = heart.y + heart.height / 2 + Math.sin(angle) * radius;
                
                // Bright yellow particles
                window.ctx.fillStyle = '#FFFF00';
                window.ctx.globalAlpha = 0.9;
                window.ctx.beginPath();
                window.ctx.arc(px, py, 4, 0, Math.PI * 2); // Bigger particles
                window.ctx.fill();
                
                // Orange trail particles
                window.ctx.fillStyle = '#FFA500';
                window.ctx.globalAlpha = 0.7;
                window.ctx.beginPath();
                window.ctx.arc(px * 0.9, py * 0.9, 2, 0, Math.PI * 2);
                window.ctx.fill();
            }
            window.ctx.restore();
            
            // Bright white center sparkle
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FFFFFF';
            window.ctx.globalAlpha = 0.8;
            window.ctx.beginPath();
            window.ctx.arc(heart.x + heart.width / 2, heart.y + heart.height / 2, 8, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
        }
        
        // Draw heart shape (after fire effects so it appears on top)
        window.ctx.fillStyle = `rgba(255, 0, 0, ${fadeAlpha})`;
        window.ctx.beginPath();
        window.ctx.moveTo(heart.x + heart.width / 2, heart.y + heart.height / 4);
        window.ctx.bezierCurveTo(
            heart.x + heart.width / 2, heart.y,
            heart.x, heart.y,
            heart.x, heart.y + heart.height / 3
        );
        window.ctx.bezierCurveTo(
            heart.x, heart.y + heart.height / 2,
            heart.x + heart.width / 2, heart.y + heart.height,
            heart.x + heart.width / 2, heart.y + heart.height
        );
        window.ctx.bezierCurveTo(
            heart.x + heart.width / 2, heart.y + heart.height,
            heart.x + heart.width, heart.y + heart.height / 2,
            heart.x + heart.width, heart.y + heart.height / 3
        );
        window.ctx.bezierCurveTo(
            heart.x + heart.width, heart.y,
            heart.x + heart.width / 2, heart.y,
            heart.x + heart.width / 2, heart.y + heart.height / 4
        );
        window.ctx.fill();
        
        // Heart outline
        window.ctx.strokeStyle = `rgba(139, 0, 0, ${fadeAlpha})`;
        window.ctx.lineWidth = 2;
        window.ctx.stroke();
    }
}

// Draw stars
function drawStars() {
    for (let star of stars) {
        const alpha = star.life / star.maxLife;
        
        if (star.isSpecial) {
            // Special 5-star row - draw actual star shapes
            window.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`; // Bright gold
            window.ctx.strokeStyle = `rgba(255, 165, 0, ${alpha})`; // Orange outline
            window.ctx.lineWidth = 2;
            
            // Draw 5-pointed star with better proportions
            drawStar(window.ctx, star.x, star.y, 12, 5, 12, 6);
            window.ctx.fill();
            window.ctx.stroke();
            
            // Add sparkle effect in center
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FFFFFF';
            window.ctx.globalAlpha = alpha * 0.9;
            window.ctx.beginPath();
            window.ctx.arc(star.x, star.y, 4, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
            
            // Add outer glow effect for special stars
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FFD700';
            window.ctx.globalAlpha = alpha * 0.4;
            drawStar(window.ctx, star.x, star.y, 16, 5, 16, 8);
            window.ctx.fill();
            window.ctx.restore();
            
            // Add twinkle effect
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FFFFFF';
            window.ctx.globalAlpha = alpha * 0.6;
            window.ctx.beginPath();
            window.ctx.arc(star.x, star.y, 2, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
        } else if (star.color) {
            // Combo effect particles - colored circles
            window.ctx.fillStyle = star.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
            window.ctx.beginPath();
            window.ctx.arc(star.x, star.y, star.size || 3, 0, Math.PI * 2);
            window.ctx.fill();
        } else {
            // Regular explosion stars - simple circles
            window.ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`; // Gold color with fade
            window.ctx.beginPath();
            window.ctx.arc(star.x, star.y, 5, 0, Math.PI * 2);
            window.ctx.fill();
        }
    }
}

// Draw lasers
function drawLasers() {
    // Only draw lasers if Karen exists and is not defeated
    if (!window.karen || window.karen.health <= 0) {
        return;
    }
    
    for (let laser of karenLasers) {
        // Draw laser glow at origin (eye effect)
        window.ctx.save();
        window.ctx.globalCompositeOperation = 'screen';
        window.ctx.fillStyle = '#FF0000';
        window.ctx.globalAlpha = 0.6;
        window.ctx.beginPath();
        window.ctx.arc(laser.x + laser.width/2, laser.y, 6, 0, Math.PI * 2);
        window.ctx.fill();
        window.ctx.restore();
        
        // Draw main laser beam (using currentHeight for growth effect)
        window.ctx.strokeStyle = '#FF0000'; // Red laser color
        window.ctx.lineWidth = laser.width; // Use laser width for thickness
        window.ctx.beginPath();
        window.ctx.moveTo(laser.x, laser.y);
        window.ctx.lineTo(laser.x, laser.y + laser.currentHeight); // Use currentHeight instead of height
        window.ctx.stroke();
        
        // Draw fade-in effect at the tip (if still growing)
        if (laser.currentHeight < laser.maxHeight) {
            window.ctx.save();
            window.ctx.globalCompositeOperation = 'screen';
            window.ctx.fillStyle = '#FF0000';
            window.ctx.globalAlpha = 0.4;
            window.ctx.beginPath();
            window.ctx.arc(laser.x + laser.width/2, laser.y + laser.currentHeight, 4, 0, Math.PI * 2);
            window.ctx.fill();
            window.ctx.restore();
        }
    }
}

// Draw Karen
function drawKaren() {
    // This function is no longer used - Karen is drawn inline in the main draw() function
    // Keeping this as a placeholder to prevent any potential calls to it
    return;
}

// Draw Prompty
function drawPrompty() {
    // Save the current context state
    window.ctx.save();
    
    // Apply hurt visual effect if active
    if (promptyHurtTimer > 0) {
        promptyHurtTimer--;
        // Apply red tint to the entire drawing context
        window.ctx.globalCompositeOperation = 'multiply';
        window.ctx.fillStyle = '#FF0000';
        window.ctx.globalAlpha = 0.3; // 30% red tint
    }
    
    // Draw Prompty image if loaded, otherwise fallback
    if (promptyImage.complete) {
        window.ctx.drawImage(promptyImage, prompty.x, prompty.y, prompty.width, prompty.height);
    } else {
        // Fallback: simple blue rectangle
        window.ctx.fillStyle = '#4A90E2';
        window.ctx.fillRect(prompty.x, prompty.y, prompty.width, prompty.height);
    }
    
    // Restore the context state (this resets all globalCompositeOperation and globalAlpha)
    window.ctx.restore();
}

// Draw aiming line
function drawAimingLine() {
    // Save the current context state
    window.ctx.save();
    
    // Calculate initial trajectory
    const startX = prompty.x + prompty.width / 2;
    const startY = prompty.y + prompty.height / 2;
    const dx = mouse.x - startX;
    const dy = mouse.y - startY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) {
        window.ctx.restore();
        return;
    }
    
    const vx = (dx / distance) * 20;
    const vy = (dy / distance) * 20;
    
    // Tables for collision prediction
    const tables = [
        {x: 150, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
        {x: 550, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
        {x: 350, y: window.canvas.height - 330, width: 80, height: 60}  // Moved down 20px
    ];
    
    // Predict ricochet path
    let currentX = startX;
    let currentY = startY;
    let currentVx = vx;
    let currentVy = vy;
    let bounces = 0;
    const maxBounces = 1; // Only predict 1 bounce as requested
    
    window.ctx.strokeStyle = '#ffffff';
    window.ctx.lineWidth = 2;
    window.ctx.setLineDash([5, 5]); // Create dotted line
    
    window.ctx.beginPath();
    window.ctx.moveTo(startX, startY);
    
    while (bounces < maxBounces) {
        // Move along current trajectory with smaller steps for more accuracy
        let nextX = currentX + currentVx * 1; // Smaller step size for more precise prediction
        let nextY = currentY + currentVy * 1;
        
        // Apply gravity (same as heart physics)
        currentVy += 0.15 * 1; // Gravity applied over 1 frame
        
        // Check wall collisions
        if (nextX <= 0 || nextX >= window.canvas.width) {
            currentVx *= -0.85; // Match heart physics bounce factor
            bounces++;
            if (bounces >= maxBounces) break;
        }
        
        if (nextY <= 0) {
            currentVy *= -0.85; // Match heart physics bounce factor
            bounces++;
            if (bounces >= maxBounces) break;
        }
        
        // Check table collisions
        let hitTable = false;
        for (let table of tables) {
            if (nextX < table.x + table.width &&
                nextX + 25 > table.x &&
                nextY < table.y + table.height &&
                nextY + 25 > table.y) {
                
                // Use the same collision detection logic as heart physics
                const heartCenterX = nextX + 12.5;
                const heartCenterY = nextY + 12.5;
                const tableCenterX = table.x + table.width / 2;
                const tableCenterY = table.y + table.height / 2;
                
                // Calculate distances to each edge (same as heart physics)
                const distToLeft = Math.abs(heartCenterX - table.x);
                const distToRight = Math.abs(heartCenterX - (table.x + table.width));
                const distToTop = Math.abs(heartCenterY - table.y);
                const distToBottom = Math.abs(heartCenterY - (table.y + table.height));
                
                // Find the closest edge
                const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                
                // Bounce based on the closest edge (same as heart physics)
                if (minDist === distToLeft) {
                    // Hit left edge - bounce right
                    currentVx = Math.abs(currentVx) * 0.85;
                    nextX = table.x - 25;
                } else if (minDist === distToRight) {
                    // Hit right edge - bounce left
                    currentVx = -Math.abs(currentVx) * 0.85;
                    nextX = table.x + table.width;
                } else if (minDist === distToTop) {
                    // Hit top edge - bounce down
                    currentVy = Math.abs(currentVy) * 0.85;
                    nextY = table.y - 25;
                } else {
                    // Hit bottom edge - bounce up
                    currentVy = -Math.abs(currentVy) * 0.85;
                    nextY = table.y + table.height;
                }
                
                hitTable = true;
                bounces++;
                if (bounces >= maxBounces) break;
                break;
            }
        }
        
        if (hitTable) continue;
        
        // Draw the line segment
        window.ctx.lineTo(nextX, nextY);
        window.ctx.stroke();
        
        // Update position for next iteration
        currentX = nextX;
        currentY = nextY;
        
        // Stop if going off screen
        if (nextY > window.canvas.height) break;
    }
    
    window.ctx.stroke();
    
    // Restore the context state (this resets setLineDash and other properties)
    window.ctx.restore();
}

// Draw Evil Google Exec
function drawEvilGoogleExec() {
    try {
        if (!window.evilGoogleExec || !window.evilGoogleExecImage) return;
        
        const exec = window.evilGoogleExec;
        
        // Apply fade-out effect if defeated
        if (exec.isDefeated) {
            window.ctx.globalAlpha = 1 - (exec.fadeTimer / 120); // Fade over 2 seconds
        }
        
        // Draw Evil Google Exec
        window.ctx.drawImage(window.evilGoogleExecImage, exec.x, exec.y, exec.width, exec.height);
        
        // Draw health bar
        const barWidth = 100;
        const barHeight = 8;
        const barX = exec.x + (exec.width - barWidth) / 2;
        const barY = exec.y - 20;
        
        // Health bar background
        window.ctx.fillStyle = '#333';
        window.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Health bar fill
        const healthPercent = exec.health / exec.maxHealth;
        window.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        window.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        // Health bar border
        window.ctx.strokeStyle = '#fff';
        window.ctx.lineWidth = 1;
        window.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Draw speech bubble if visible and not defeated
        if (exec.speechBubbleVisible && !exec.isDefeated) {
            const bubbleWidth = 200;
            const bubbleHeight = 60;
            const bubbleX = exec.x + (exec.width - bubbleWidth) / 2;
            const bubbleY = exec.y - 80;
            
            // Speech bubble background
            window.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            window.ctx.fillRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
            
            // Speech bubble border
            window.ctx.strokeStyle = '#000';
            window.ctx.lineWidth = 2;
            window.ctx.strokeRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight);
            
            // Speech bubble text with better wrapping
            window.ctx.fillStyle = '#000';
            window.ctx.font = '12px Arial'; // Smaller font
            window.ctx.textAlign = 'center';
            
            // Better text wrapping - split by character count instead of word count
            const maxCharsPerLine = 25;
            const quote = exec.currentQuote;
            
            if (quote.length <= maxCharsPerLine) {
                // Single line
                window.ctx.fillText(quote, bubbleX + bubbleWidth / 2, bubbleY + 30);
            } else {
                // Split into multiple lines
                const words = quote.split(' ');
                let line1 = '';
                let line2 = '';
                let line3 = '';
                
                for (let word of words) {
                    if (line1.length + word.length <= maxCharsPerLine) {
                        line1 += (line1 ? ' ' : '') + word;
                    } else if (line2.length + word.length <= maxCharsPerLine) {
                        line2 += (line2 ? ' ' : '') + word;
                    } else {
                        line3 += (line3 ? ' ' : '') + word;
                    }
                }
                
                // Draw lines with proper spacing
                if (line1) window.ctx.fillText(line1, bubbleX + bubbleWidth / 2, bubbleY + 20);
                if (line2) window.ctx.fillText(line2, bubbleX + bubbleWidth / 2, bubbleY + 35);
                if (line3) window.ctx.fillText(line3, bubbleX + bubbleWidth / 2, bubbleY + 50);
            }
        }
        
        // Draw "Fine." text if defeated (first second)
        if (exec.isDefeated && exec.fadeTimer < 60) {
            window.ctx.fillStyle = '#fff';
            window.ctx.font = 'bold 20px Arial';
            window.ctx.textAlign = 'center';
            window.ctx.fillText("Fine.", exec.x + exec.width / 2, exec.y + exec.height / 2);
        }
        
        // Reset alpha
        window.ctx.globalAlpha = 1;
    } catch (error) {
        console.error('Error drawing Evil Google Exec:', error);
        // Remove the problematic Evil Google Exec
        window.evilGoogleExec = null;
    }
}

// Draw Evil Google Exec arrows
function drawEvilGoogleArrows() {
    try {
        if (!window.evilGoogleArrows) return;
        
        for (let arrow of window.evilGoogleArrows) {
            // Draw arrow shaft (red rectangle)
            window.ctx.fillStyle = arrow.color;
            window.ctx.fillRect(arrow.x + 6, arrow.y, 4, arrow.height - 10);
            
            // Draw arrow head (red triangle pointing down)
            window.ctx.beginPath();
            window.ctx.moveTo(arrow.x + 8, arrow.y + arrow.height); // Bottom point
            window.ctx.lineTo(arrow.x, arrow.y + arrow.height - 15); // Top left
            window.ctx.lineTo(arrow.x + 16, arrow.y + arrow.height - 15); // Top right
            window.ctx.closePath();
            window.ctx.fill();
            
            // Draw arrow border for better visibility
            window.ctx.strokeStyle = '#800000';
            window.ctx.lineWidth = 1;
            window.ctx.stroke();
        }
    } catch (error) {
        console.error('Error drawing Evil Google Exec arrows:', error);
        // Clear the problematic arrows array
        window.evilGoogleArrows = [];
    }
}

// Draw floating texts (SEO Boost, etc.)
function drawFloatingTexts() {
    if (!window.floatingTexts) return;
    
    for (let i = window.floatingTexts.length - 1; i >= 0; i--) {
        const text = window.floatingTexts[i];
        
        // Update position
        text.y += text.vy;
        text.life--;
        
        // Calculate alpha (fade out)
        text.alpha = text.life / text.maxLife;
        
        // Draw text with shadow for better visibility
        window.ctx.save();
        window.ctx.globalAlpha = text.alpha;
        
        // Draw shadow
        window.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        window.ctx.font = `bold ${text.fontSize}px Arial`;
        window.ctx.textAlign = 'center';
        window.ctx.fillText(text.text, text.x + 2, text.y + 2);
        
        // Draw main text
        window.ctx.fillStyle = text.color;
        window.ctx.fillText(text.text, text.x, text.y);
        
        window.ctx.restore();
        
        // Remove if expired
        if (text.life <= 0) {
            window.floatingTexts.splice(i, 1);
        }
    }
}

// Draw Teresa the Reporter
function drawTeresa() {
    try {
        if (!window.teresa) return;
        const teresa = window.teresa;
        
        // Apply fade-out effect if defeated
        if (teresa.isDefeated) {
            window.ctx.globalAlpha = 1 - (teresa.fadeTimer / 120);
        }
        
        // Draw Teresa image or fallback rectangle
        if (window.teresaImage && window.teresaImage.complete && window.teresaImage.naturalHeight !== 0) {
            window.ctx.drawImage(window.teresaImage, teresa.x, teresa.y, teresa.width, teresa.height);
        } else {
            // Fallback: draw a simple rectangle if image failed to load
            window.ctx.fillStyle = '#4A90E2';
            window.ctx.fillRect(teresa.x, teresa.y, teresa.width, teresa.height);
            window.ctx.fillStyle = '#ffffff';
            window.ctx.font = '12px Arial';
            window.ctx.textAlign = 'center';
            window.ctx.fillText('Teresa', teresa.x + teresa.width / 2, teresa.y + teresa.height / 2);
        }
        
        // Teresa doesn't have a health bar - she's defeated in one hit
        
        // Draw health bar for Teresa (now that she has a health system)
        const healthBarWidth = 100;
        const healthBarHeight = 8;
        const healthBarX = teresa.x + (teresa.width - healthBarWidth) / 2;
        const healthBarY = teresa.y - 15;
        
        // Background
        window.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        window.ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Health bar fill (green for positive character)
        const healthPercent = teresa.health / teresa.maxHealth;
        window.ctx.fillStyle = '#00ff00';
        window.ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
        
        // Border
        window.ctx.strokeStyle = '#ffffff';
        window.ctx.lineWidth = 1;
        window.ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
        
        // Draw speech bubble
        if (teresa.speechBubbleVisible && !teresa.isDefeated) {
            const bubbleX = teresa.x + teresa.width / 2;
            const bubbleY = Math.max(teresa.y - 40, 60); // Ensure bubble doesn't go above y=60
            const bubbleWidth = 200;
            const bubbleHeight = 60;
            
            // Bubble background
            window.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            window.ctx.strokeStyle = '#000000';
            window.ctx.lineWidth = 2;
            
            // Draw bubble with simple rectangle (more compatible than roundRect)
            window.ctx.fillRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight, bubbleWidth, bubbleHeight);
            window.ctx.strokeRect(bubbleX - bubbleWidth / 2, bubbleY - bubbleHeight, bubbleWidth, bubbleHeight);
            
            // Draw speech bubble tail
            window.ctx.beginPath();
            window.ctx.moveTo(bubbleX, bubbleY);
            window.ctx.lineTo(bubbleX - 10, bubbleY + 10);
            window.ctx.lineTo(bubbleX + 10, bubbleY + 10);
            window.ctx.closePath();
            window.ctx.fill();
            window.ctx.stroke();
            
            // Text
            window.ctx.fillStyle = '#000000';
            window.ctx.font = '14px Arial';
            window.ctx.textAlign = 'center';
            
            // Split quote into multiple lines if needed
            const words = teresa.currentQuote.split(' ');
            const lines = [];
            let currentLine = '';
            
            for (let word of words) {
                if (currentLine.length + word.length > 25) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    currentLine += (currentLine ? ' ' : '') + word;
                }
            }
            if (currentLine) lines.push(currentLine);
            
            // Draw text lines
            for (let i = 0; i < lines.length; i++) {
                window.ctx.fillText(lines[i], bubbleX, bubbleY - bubbleHeight / 2 + (i - lines.length / 2 + 0.5) * 16);
            }
        }
        
        // Draw "Fine." text when defeated (first second)
        if (teresa.isDefeated && teresa.fadeTimer < 60) {
            window.ctx.globalAlpha = 1;
            window.ctx.fillStyle = '#ffffff';
            window.ctx.font = 'bold 20px Arial';
            window.ctx.textAlign = 'center';
            window.ctx.fillText('Fine.', teresa.x + teresa.width / 2, teresa.y + teresa.height / 2);
        }
        
        window.ctx.globalAlpha = 1;
    } catch (error) {
        console.error('Error drawing Teresa:', error);
        window.teresa = null;
    }
}

// Load Teresa the Reporter image
window.teresaImage = new Image();
window.teresaImage.onload = function() {
    console.log('Teresa image loaded successfully');
};
window.teresaImage.onerror = function() {
    console.error('Failed to load Teresa image');
    window.teresaImage = null;
};
window.teresaImage.src = 'https://ltneloufqjktdplodvao.supabase.co/storage/v1/object/public/logos/prompt-assets/reporter.png';

// Draw Karen's speech bubble
function drawKarenSpeechBubble() {
    if (window.karen && window.karen.speechBubbleVisible && !window.karen.isDefeated && window.karen.health > 0) {
        window.ctx.fillStyle = '#FFFFFF';
        window.ctx.strokeStyle = '#000000';
        window.ctx.lineWidth = 2;
        
        // Speech bubble - made bigger for better text positioning
        window.ctx.beginPath();
        window.ctx.roundRect(window.karen.x - 100, window.karen.y - 60, 200, 50, 10);
        window.ctx.fill();
        window.ctx.stroke();
        
        // Speech bubble tail
        window.ctx.beginPath();
        window.ctx.moveTo(window.karen.x + window.karen.width / 2, window.karen.y - 10);
        window.ctx.lineTo(window.karen.x + window.karen.width / 2 - 10, window.karen.y);
        window.ctx.lineTo(window.karen.x + window.karen.width / 2 + 10, window.karen.y);
        window.ctx.closePath();
        window.ctx.fill();
        window.ctx.stroke();
        
        // Speech bubble text - centered in the bubble
        window.ctx.fillStyle = '#000000';
        window.ctx.font = 'bold 14px Arial';
        window.ctx.textAlign = 'center';
        window.ctx.textBaseline = 'middle';
        
        // Split quote into lines if it's long
        const quote = window.karen.currentQuote;
        const maxLength = 20; // Characters per line
        
        if (quote.length <= maxLength) {
            // Single line quote
            window.ctx.fillText(quote, window.karen.x, window.karen.y - 37);
        } else {
            // Multi-line quote - split at spaces
            const words = quote.split(' ');
            let line1 = '';
            let line2 = '';
            
            for (let word of words) {
                if (line1.length + word.length <= maxLength) {
                    line1 += (line1 ? ' ' : '') + word;
                } else {
                    line2 += (line2 ? ' ' : '') + word;
                }
            }
            
            window.ctx.fillText(line1, window.karen.x, window.karen.y - 45);
            window.ctx.fillText(line2, window.karen.x, window.karen.y - 30);
        }
    }
}

// Draw Evil Google Exec's speech bubble
function drawEvilGoogleExecSpeechBubble() {
    if (window.evilGoogleExec && window.evilGoogleExec.speechBubbleVisible && !window.evilGoogleExec.isDefeated && window.evilGoogleExec.health > 0) {
        const exec = window.evilGoogleExec;
        window.ctx.fillStyle = '#FFFFFF';
        window.ctx.strokeStyle = '#000000';
        window.ctx.lineWidth = 2;
        
        // Speech bubble
        window.ctx.beginPath();
        window.ctx.roundRect(exec.x - 100, exec.y - 60, 200, 50, 10);
        window.ctx.fill();
        window.ctx.stroke();
        
        // Speech bubble tail
        window.ctx.beginPath();
        window.ctx.moveTo(exec.x + exec.width / 2, exec.y - 10);
        window.ctx.lineTo(exec.x + exec.width / 2 - 10, exec.y);
        window.ctx.lineTo(exec.x + exec.width / 2 + 10, exec.y);
        window.ctx.closePath();
        window.ctx.fill();
        window.ctx.stroke();
        
        // Speech bubble text
        window.ctx.fillStyle = '#000000';
        window.ctx.font = 'bold 12px Arial';
        window.ctx.textAlign = 'center';
        window.ctx.textBaseline = 'middle';
        
        // Handle long quotes with multiple lines
        const quote = exec.currentQuote;
        const maxLength = 25;
        
        if (quote.length <= maxLength) {
            window.ctx.fillText(quote, exec.x, exec.y - 37);
        } else {
            // Split into multiple lines
            const words = quote.split(' ');
            let lines = ['', '', ''];
            let currentLine = 0;
            
            for (let word of words) {
                if (lines[currentLine].length + word.length <= maxLength) {
                    lines[currentLine] += (lines[currentLine] ? ' ' : '') + word;
                } else {
                    currentLine++;
                    if (currentLine < 3) {
                        lines[currentLine] = word;
                    }
                }
            }
            
            // Draw up to 3 lines
            for (let i = 0; i < 3; i++) {
                if (lines[i]) {
                    window.ctx.fillText(lines[i], exec.x, exec.y - 45 + (i * 12));
                }
            }
        }
    }
}

// Draw LinkedIn Spammer's speech bubble
function drawLinkedInSpammerSpeechBubble() {
    if (window.linkedInSpammer && window.linkedInSpammer.speechBubbleVisible && !window.linkedInSpammer.isDefeated && window.linkedInSpammer.health > 0) {
        const spammer = window.linkedInSpammer;
        window.ctx.fillStyle = '#FFFFFF';
        window.ctx.strokeStyle = '#000000';
        window.ctx.lineWidth = 2;
        
        // Speech bubble
        window.ctx.beginPath();
        window.ctx.roundRect(spammer.x - 100, spammer.y - 60, 200, 50, 10);
        window.ctx.fill();
        window.ctx.stroke();
        
        // Speech bubble tail
        window.ctx.beginPath();
        window.ctx.moveTo(spammer.x + spammer.width / 2, spammer.y - 10);
        window.ctx.lineTo(spammer.x + spammer.width / 2 - 10, spammer.y);
        window.ctx.lineTo(spammer.x + spammer.width / 2 + 10, spammer.y);
        window.ctx.closePath();
        window.ctx.fill();
        window.ctx.stroke();
        
        // Speech bubble text
        window.ctx.fillStyle = '#000000';
        window.ctx.font = 'bold 14px Arial';
        window.ctx.textAlign = 'center';
        window.ctx.textBaseline = 'middle';
        
        const quote = spammer.currentQuote;
        const maxLength = 20;
        
        if (quote.length <= maxLength) {
            window.ctx.fillText(quote, spammer.x, spammer.y - 37);
        } else {
            // Split into multiple lines
            const words = quote.split(' ');
            let line1 = '';
            let line2 = '';
            
            for (let word of words) {
                if (line1.length + word.length <= maxLength) {
                    line1 += (line1 ? ' ' : '') + word;
                } else {
                    line2 += (line2 ? ' ' : '') + word;
                }
            }
            
            window.ctx.fillText(line1, spammer.x, spammer.y - 45);
            window.ctx.fillText(line2, spammer.x, spammer.y - 30);
        }
    }
}

// Main draw function
function draw() {
    try {
        // Don't draw during state transitions to prevent crashes
        if (!window.gameState || window.gameState !== 'playing') {
            return;
        }
        
        // Apply screen shake
        window.ctx.save();
        window.ctx.translate(screenShakeX, screenShakeY);
        
        // Clear canvas with cafe background
        drawBackground();
        
        // Draw customers
        drawCustomers();
        
        // Draw hearts
        drawHearts();
        
        // Draw stars
        drawStars();
        
        // Draw Karen (ULTRA SIMPLIFIED TO PREVENT FREEZING)
        if (window.karen && !window.karen.isDefeated && window.karen.health > 0) {
            // Draw Karen normally - no complex effects
            window.ctx.drawImage(window.karenImage, window.karen.x, window.karen.y, window.karen.width, window.karen.height);
            
            // Draw health bar
            const barWidth = 100;
            const barHeight = 8;
            const barX = window.karen.x + (window.karen.width - barWidth) / 2;
            const barY = window.karen.y - 20;
            
            // Health bar background
            window.ctx.fillStyle = '#333';
            window.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health bar fill
            const healthPercent = window.karen.health / window.karen.maxHealth;
            window.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            window.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Health bar border
            window.ctx.strokeStyle = '#fff';
            window.ctx.lineWidth = 1;
            window.ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Draw Karen's speech bubble
            drawKarenSpeechBubble();
        }
        
        // Draw Evil Google Exec (ULTRA SIMPLIFIED TO PREVENT FREEZING)
        if (window.evilGoogleExec && !window.evilGoogleExec.isDefeated && window.evilGoogleExec.health > 0) {
            window.ctx.drawImage(window.evilGoogleExecImage, window.evilGoogleExec.x, window.evilGoogleExec.y, window.evilGoogleExec.width, window.evilGoogleExec.height);
            
            // Draw health bar
            const barWidth = 100;
            const barHeight = 8;
            const barX = window.evilGoogleExec.x + (window.evilGoogleExec.width - barWidth) / 2;
            const barY = window.evilGoogleExec.y - 20;
            
            // Health bar background
            window.ctx.fillStyle = '#333';
            window.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health bar fill
            const healthPercent = window.evilGoogleExec.health / window.evilGoogleExec.maxHealth;
            window.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            window.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Health bar border
            window.ctx.strokeStyle = '#fff';
            window.ctx.lineWidth = 1;
            window.ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Draw Evil Google Exec's speech bubble
            drawEvilGoogleExecSpeechBubble();
        }
        
        // Draw LinkedIn Spammer (ULTRA SIMPLIFIED TO PREVENT FREEZING)
        if (window.linkedInSpammer && !window.linkedInSpammer.isDefeated && window.linkedInSpammer.health > 0) {
            window.ctx.drawImage(window.linkedInSpammerImage, window.linkedInSpammer.x, window.linkedInSpammer.y, window.linkedInSpammer.width, window.linkedInSpammer.height);
            
            // Draw health bar
            const barWidth = 100;
            const barHeight = 8;
            const barX = window.linkedInSpammer.x + (window.linkedInSpammer.width - barWidth) / 2;
            const barY = window.linkedInSpammer.y - 20;
            
            // Health bar background
            window.ctx.fillStyle = '#333';
            window.ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health bar fill
            const healthPercent = window.linkedInSpammer.health / window.linkedInSpammer.maxHealth;
            window.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
            window.ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Health bar border
            window.ctx.strokeStyle = '#fff';
            window.ctx.lineWidth = 1;
            window.ctx.strokeRect(barX, barY, barWidth, barHeight);
            
            // Draw LinkedIn Spammer's speech bubble
            drawLinkedInSpammerSpeechBubble();
        }
        
        // Draw Karen lasers (RE-ENABLED)
        drawLasers();
        
        // Draw Evil Google Exec arrows
        drawEvilGoogleArrows();
        
        // Draw Prompty
        drawPrompty();
        
        // Draw power-ups
        drawPowerUps();
        
        // Draw floating texts
        drawFloatingTexts();
        
        // Draw aiming line
        drawAimingLine();
        
        // Restore screen shake
        window.ctx.restore();
        
    } catch (error) {
        console.error('Error in draw function:', error);
        // Try to recover by restoring context
        try {
            window.ctx.restore();
        } catch (restoreError) {
            console.error('Error restoring context:', restoreError);
        }
    }
}