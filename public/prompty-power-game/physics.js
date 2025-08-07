/**
 * Physics System for Prompty Power Game
 * Handles movement, collision detection, and physics calculations
 */

// Helper function to check if path is clear
function isPathClear(customer, targetX, targetY, tables) {
    // Check if the path from current position to target is clear
    const startX = customer.x;
    const startY = customer.y;
    const endX = targetX;
    const endY = targetY;
    
    // Check if target position would collide with any table
    for (let table of tables) {
        if (endX < table.x + table.width &&
            endX + customer.width > table.x &&
            endY < table.y + table.height &&
            endY + customer.height > table.y) {
            return false;
        }
    }
    return true;
}

// Update heart physics
function updateHearts() {
    if (window.gameState === 'gameOver') return;
    
    // Memory management: limit hearts array size
    if (hearts.length > 50) {
        hearts.splice(0, 10); // Remove oldest 10 hearts
    }
    
    for (let i = hearts.length - 1; i >= 0; i--) {
        const heart = hearts[i];
        
        // Apply gravity with reduced effect for better trajectory
        heart.vy += 0.15; // Reduced from 0.2 for better arc
        
        // Update position
        heart.x += heart.vx;
        heart.y += heart.vy;
        
        // Remove hearts that go far off screen (memory management)
        if (heart.x < -100 || heart.x > window.canvas.width + 100 || 
            heart.y < -100 || heart.y > window.canvas.height + 100) {
            hearts.splice(i, 1);
            continue;
        }
        
        // Bounce off left/right walls with improved angle calculation
        if (heart.x <= 0) {
            heart.vx = Math.abs(heart.vx) * 0.85; // Better bounce preservation
            heart.x = 0;
            heart.bounces++;
            playSound('bounce');
        } else if (heart.x + heart.width >= window.canvas.width) {
            heart.vx = -Math.abs(heart.vx) * 0.85; // Better bounce preservation
            heart.x = window.canvas.width - heart.width;
            heart.bounces++;
            playSound('bounce');
        }
        
        // Bounce off top wall with improved angle
        if (heart.y <= 0) {
            heart.vy = Math.abs(heart.vy) * 0.85; // Better bounce preservation
            heart.y = 0;
            heart.bounces++;
            playSound('bounce');
        }
        
        // Check collision with tables with improved bounce angles
        const tables = [
            {x: 150, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
            {x: 550, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
            {x: 350, y: window.canvas.height - 330, width: 80, height: 60}  // Moved down 20px
        ];
        
        for (let table of tables) {
            // Check collision detection
            if (heart.x < table.x + table.width &&
                heart.x + heart.width > table.x &&
                heart.y < table.y + table.height &&
                heart.y + heart.height > table.y) {
                
                // Calculate overlap distances for more accurate collision response
                const overlapLeft = (heart.x + heart.width) - table.x;
                const overlapRight = (table.x + table.width) - heart.x;
                const overlapTop = (heart.y + heart.height) - table.y;
                const overlapBottom = (table.y + table.height) - heart.y;
                
                // Find the smallest overlap to determine collision side
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                // Bounce based on the smallest overlap with proper positioning
                if (minOverlap === overlapLeft && heart.vx > 0) {
                    // Hit left edge - bounce right
                    heart.vx = -Math.abs(heart.vx) * 0.85;
                    heart.x = table.x - heart.width - 1; // Small buffer to prevent re-collision
                    heart.bounces++;
                    playSound('bounce');
                } else if (minOverlap === overlapRight && heart.vx < 0) {
                    // Hit right edge - bounce left
                    heart.vx = Math.abs(heart.vx) * 0.85;
                    heart.x = table.x + table.width + 1; // Small buffer to prevent re-collision
                    heart.bounces++;
                    playSound('bounce');
                } else if (minOverlap === overlapTop && heart.vy > 0) {
                    // Hit top edge - bounce down
                    heart.vy = -Math.abs(heart.vy) * 0.85;
                    heart.y = table.y - heart.height - 1; // Small buffer to prevent re-collision
                    heart.bounces++;
                    playSound('bounce');
                } else if (minOverlap === overlapBottom && heart.vy < 0) {
                    // Hit bottom edge - bounce up
                    heart.vy = Math.abs(heart.vy) * 0.85;
                    heart.y = table.y + table.height + 1; // Small buffer to prevent re-collision
                    heart.bounces++;
                    playSound('bounce');
                }
                
                // Add some randomness to the bounce to make it more realistic
                heart.vx += (Math.random() - 0.5) * 0.3;
                heart.vy += (Math.random() - 0.5) * 0.3;
                
                // Ensure minimum velocity to prevent hearts from getting stuck
                const minVelocity = 0.8;
                if (Math.abs(heart.vx) < minVelocity) heart.vx = heart.vx > 0 ? minVelocity : -minVelocity;
                if (Math.abs(heart.vy) < minVelocity) heart.vy = heart.vy > 0 ? minVelocity : -minVelocity;
                
                break; // Exit after first table collision
            }
        }
        
        // Remove if off screen or max bounces reached
        if (heart.y > window.canvas.height || heart.bounces >= heart.maxBounces) {
            hearts.splice(i, 1);
        }
    }
}

// Update customer movement with track-based physics
function updateCustomers() {
    if (window.gameState === 'gameOver') return;
    
    for (let i = customers.length - 1; i >= 0; i--) {
        const customer = customers[i];
        
        // Define tables for collision detection
        const tables = [
            {x: 150, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
            {x: 550, y: window.canvas.height - 280, width: 80, height: 60}, // Moved down 20px
            {x: 350, y: window.canvas.height - 330, width: 80, height: 60}  // Moved down 20px
        ];
        
        // Track-based movement with table avoidance
        if (customer.movementState === 'left') {
            // Check for table collision BEFORE moving
            let willHitTable = false;
            let tableToAvoid = null;
            
            for (let table of tables) {
                // Check if the next position would hit a table
                const nextX = customer.x + customer.vx;
                if (nextX < table.x + table.width &&
                    nextX + customer.width > table.x &&
                    customer.y < table.y + table.height &&
                    customer.y + customer.height > table.y) {
                    willHitTable = true;
                    tableToAvoid = table;
                    break;
                }
            }
            
            if (willHitTable && tableToAvoid) {
                // Avoid table by moving down
                customer.movementState = 'down';
                customer.vx = 0;
                // Maintain speed demon speed for downward movement
                const baseSpeed = 0.3 + (level * 0.05);
                customer.vy = customer.isSpeedDemon ? baseSpeed * 2.5 : baseSpeed;
                customer.targetY = customer.y + 50;
                // Move to left of table
                customer.x = tableToAvoid.x - customer.width;
            } else {
                // Safe to move left
                customer.x += customer.vx;
            }
            
            // Hit left wall, start moving down
            if (customer.x <= 0) {
                customer.movementState = 'down';
                customer.vx = 0;
                // Maintain speed demon speed for downward movement
                const baseSpeed = 0.3;
                customer.vy = customer.isSpeedDemon ? baseSpeed * 2.5 : baseSpeed;
                customer.targetY = customer.y + 50; // Move down 50 pixels
            }
        } else if (customer.movementState === 'right') {
            // Check for table collision BEFORE moving
            let willHitTable = false;
            let tableToAvoid = null;
            
            for (let table of tables) {
                // Check if the next position would hit a table
                const nextX = customer.x + customer.vx;
                if (nextX < table.x + table.width &&
                    nextX + customer.width > table.x &&
                    customer.y < table.y + table.height &&
                    customer.y + customer.height > table.y) {
                    willHitTable = true;
                    tableToAvoid = table;
                    break;
                }
            }
            
            if (willHitTable && tableToAvoid) {
                // Avoid table by moving down
                customer.movementState = 'down';
                customer.vx = 0;
                // Maintain speed demon speed for downward movement
                const baseSpeed = 0.3 + (level * 0.05);
                customer.vy = customer.isSpeedDemon ? baseSpeed * 2.5 : baseSpeed;
                customer.targetY = customer.y + 50;
                // Move to right of table
                customer.x = tableToAvoid.x + tableToAvoid.width;
            } else {
                // Safe to move right
                customer.x += customer.vx;
            }
            
            // Hit right wall, start moving down
            if (customer.x >= window.canvas.width - customer.width) {
                customer.movementState = 'down';
                customer.vx = 0;
                // Maintain speed demon speed for downward movement
                const baseSpeed = 0.3;
                customer.vy = customer.isSpeedDemon ? baseSpeed * 2.5 : baseSpeed;
                customer.targetY = customer.y + 50; // Move down 50 pixels
            }
        } else if (customer.movementState === 'down') {
            customer.y += customer.vy; // Move down
            
            // Check if we're near a table while moving down
            let nearTable = false;
            for (let table of tables) {
                if (customer.y + customer.height >= table.y - 10 && 
                    customer.y <= table.y + table.height + 10 &&
                    customer.x < table.x + table.width &&
                    customer.x + customer.width > table.x) {
                    nearTable = true;
                    break;
                }
            }
            
            // Reached target Y, start moving in opposite direction of original direction
            if (customer.y >= customer.targetY && !nearTable) {
                if (customer.direction === 'left') {
                    // If originally went left, now go right
                    customer.movementState = 'right';
                    // Maintain speed demon speed
                    const baseSpeed = 0.7;
                    customer.vx = customer.isSpeedDemon ? baseSpeed * 2.5 : baseSpeed;
                    customer.vy = 0;
                } else {
                    // If originally went right, now go left
                    customer.movementState = 'left';
                    // Maintain speed demon speed
                    const baseSpeed = -0.7;
                    customer.vx = customer.isSpeedDemon ? baseSpeed * 2.5 : baseSpeed;
                    customer.vy = 0;
                }
            } else if (nearTable) {
                // If near a table, continue moving down
                customer.targetY = customer.y + 30;
            }
        }
        
        // Safety mechanism: if emoji is stuck for too long, force it to move down
        if (customer.movementState === 'left' || customer.movementState === 'right') {
            customer.stuckTimer = (customer.stuckTimer || 0) + 1;
            if (customer.stuckTimer > 300) { // 5 seconds stuck
                customer.movementState = 'down';
                customer.vx = 0;
                customer.vy = 0.3; // Slower downward movement (was 0.5)
                customer.targetY = customer.y + 50;
                customer.stuckTimer = 0;
            }
        } else {
            customer.stuckTimer = 0; // Reset stuck timer when moving down
        }
        
        // Remove if they reach bottom
        if (customer.y > window.canvas.height) {
            // Customer escaped - Prompty loses a life
            window.lives--;
                playSound('oof');
            customers.splice(i, 1);
            
            // Play hurt sound (triple ouch)
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

// Update sick emojis
function updateSickEmojis() {
    if (!window.sickEmojis || window.gameState === 'gameOver') return;
    
    for (let i = window.sickEmojis.length - 1; i >= 0; i--) {
        const sickEmoji = window.sickEmojis[i];
        
        // Update position
        sickEmoji.x += sickEmoji.vx;
        sickEmoji.y += sickEmoji.vy;
        
        // Bounce off walls
        if (sickEmoji.x <= 0 || sickEmoji.x >= window.canvas.width - sickEmoji.width) {
            sickEmoji.vx = -sickEmoji.vx;
            sickEmoji.x = Math.max(0, Math.min(window.canvas.width - sickEmoji.width, sickEmoji.x));
        }
        if (sickEmoji.y <= 0 || sickEmoji.y >= window.canvas.height - sickEmoji.height) {
            sickEmoji.vy = -sickEmoji.vy;
            sickEmoji.y = Math.max(0, Math.min(window.canvas.height - sickEmoji.height, sickEmoji.y));
        }
        
        // Check collision with tables (keep virus above tables)
        const tables = [
            {x: 150, y: window.canvas.height - 280, width: 80, height: 60},
            {x: 550, y: window.canvas.height - 280, width: 80, height: 60},
            {x: 350, y: window.canvas.height - 330, width: 80, height: 60}
        ];
        
        for (let table of tables) {
            if (sickEmoji.x < table.x + table.width &&
                sickEmoji.x + sickEmoji.width > table.x &&
                sickEmoji.y < table.y + table.height &&
                sickEmoji.y + sickEmoji.height > table.y) {
                
                // Calculate overlap distances for accurate collision response
                const overlapLeft = (sickEmoji.x + sickEmoji.width) - table.x;
                const overlapRight = (table.x + table.width) - sickEmoji.x;
                const overlapTop = (sickEmoji.y + sickEmoji.height) - table.y;
                const overlapBottom = (table.y + table.height) - sickEmoji.y;
                
                // Find the smallest overlap to determine collision side
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                // Bounce based on the smallest overlap
                if (minOverlap === overlapLeft && sickEmoji.vx > 0) {
                    sickEmoji.vx = -Math.abs(sickEmoji.vx) * 0.8;
                    sickEmoji.x = table.x - sickEmoji.width - 1;
                } else if (minOverlap === overlapRight && sickEmoji.vx < 0) {
                    sickEmoji.vx = Math.abs(sickEmoji.vx) * 0.8;
                    sickEmoji.x = table.x + table.width + 1;
                } else if (minOverlap === overlapTop && sickEmoji.vy > 0) {
                    sickEmoji.vy = -Math.abs(sickEmoji.vy) * 0.8;
                    sickEmoji.y = table.y - sickEmoji.height - 1;
                } else if (minOverlap === overlapBottom && sickEmoji.vy < 0) {
                    sickEmoji.vy = Math.abs(sickEmoji.vy) * 0.8;
                    sickEmoji.y = table.y + table.height + 1;
                }
                break;
            }
        }
        
        // Sneeze at Prompty
        sickEmoji.lastSneezeTime++;
        if (sickEmoji.lastSneezeTime >= sickEmoji.sneezeInterval) {
            // Create virus sneeze towards Prompty's current position
            createVirusSneezeAt(
                sickEmoji.x + sickEmoji.width / 2,
                sickEmoji.y + sickEmoji.height / 2,
                window.prompty.x + window.prompty.width / 2,
                window.prompty.y + window.prompty.height / 2
            );
            sickEmoji.lastSneezeTime = 0;
        }
        
        // Check collision with Prompty's hearts
        for (let j = window.hearts.length - 1; j >= 0; j--) {
            const heart = window.hearts[j];
            if (heart.x < sickEmoji.x + sickEmoji.width &&
                heart.x + heart.width > sickEmoji.x &&
                heart.y < sickEmoji.y + sickEmoji.height &&
                heart.y + heart.height > sickEmoji.y) {
                
                // Hit the sick emoji
                sickEmoji.hits++;
                window.hearts.splice(j, 1);
                
                // Create floating text showing hits remaining
                const hitsRemaining = sickEmoji.maxHits - sickEmoji.hits;
                createFloatingText(sickEmoji.x, sickEmoji.y, `${hitsRemaining} hits left!`, '#ff6b6b');
                
                // Play hit sound
                if (window.playSound) {
                    window.playSound('hit');
                }
                
                // Remove if defeated
                if (sickEmoji.hits >= sickEmoji.maxHits) {
                    // Award points for defeating sick emoji
                    window.score += 500;
                    createFloatingText(sickEmoji.x, sickEmoji.y, '+500 VIRUS DEFEATED!', '#00ff00');
                    
                    // Play defeat sound
                    if (window.playSound) {
                        window.playSound('powerUp');
                    }
                    
                    window.sickEmojis.splice(i, 1);
                }
                break;
            }
        }
    }
}

// Update virus projectiles
function updateVirusProjectiles() {
    if (!window.virusProjectiles || window.gameState === 'gameOver') return;
    
    for (let i = window.virusProjectiles.length - 1; i >= 0; i--) {
        const virus = window.virusProjectiles[i];
        
        // Update position
        virus.x += virus.vx;
        virus.y += virus.vy;
        virus.currentLife++;
        
        // Remove if off screen or expired
        if (virus.x < -virus.width || virus.x > window.canvas.width ||
            virus.y < -virus.height || virus.y > window.canvas.height ||
            virus.currentLife >= virus.lifeTime) {
            window.virusProjectiles.splice(i, 1);
            continue;
        }
        
        // Check collision with tables (virus projectiles blocked by tables)
        const tables = [
            {x: 150, y: window.canvas.height - 280, width: 80, height: 60},
            {x: 550, y: window.canvas.height - 280, width: 80, height: 60},
            {x: 350, y: window.canvas.height - 330, width: 80, height: 60}
        ];
        
        let hitTable = false;
        for (let table of tables) {
            if (virus.x < table.x + table.width &&
                virus.x + virus.width > table.x &&
                virus.y < table.y + table.height &&
                virus.y + virus.height > table.y) {
                
                // Virus projectile hits table - remove it
                window.virusProjectiles.splice(i, 1);
                hitTable = true;
                
                // Play impact sound
                if (window.playSound) {
                    window.playSound('bounce');
                }
                
                // Create visual feedback
                if (window.createFloatingText) {
                    window.createFloatingText(virus.x, virus.y, 'BLOCKED!', '#ffaa00');
                }
                
                break;
            }
        }
        
        if (hitTable) continue; // Skip to next virus if this one hit a table
        
        // Check collision with Prompty
        if (virus.x < window.prompty.x + window.prompty.width &&
            virus.x + virus.width > window.prompty.x &&
            virus.y < window.prompty.y + window.prompty.height &&
            virus.y + virus.height > window.prompty.y) {
            
            // Hit Prompty with virus
            window.lives--;
            window.virusProjectiles.splice(i, 1);
            
            // Create floating text
            createFloatingText(window.prompty.x, window.prompty.y, 'INFECTED!', '#ff0000');
            
            // Visual hurt effect
            window.promptyHurtTimer = 30;
            
            // Play hurt sound
            if (window.playSound) {
                window.playSound('hurt');
            }
            
            if (window.lives <= 0) {
                gameOver();
                return;
            }
        }
    }
} 