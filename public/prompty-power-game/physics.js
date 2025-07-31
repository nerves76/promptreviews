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
            // Simple collision detection
            if (heart.x < table.x + table.width &&
                heart.x + heart.width > table.x &&
                heart.y < table.y + table.height &&
                heart.y + heart.height > table.y) {
                
                // Calculate which side of the table was hit for better bounce
                const heartCenterX = heart.x + heart.width / 2;
                const heartCenterY = heart.y + heart.height / 2;
                const tableCenterX = table.x + table.width / 2;
                const tableCenterY = table.y + table.height / 2;
                
                // Calculate distances to each edge
                const distToLeft = Math.abs(heartCenterX - table.x);
                const distToRight = Math.abs(heartCenterX - (table.x + table.width));
                const distToTop = Math.abs(heartCenterY - table.y);
                const distToBottom = Math.abs(heartCenterY - (table.y + table.height));
                
                // Find the closest edge
                const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);
                
                // Bounce based on the closest edge with improved positioning
                if (minDist === distToLeft) {
                    // Hit left edge - bounce right
                    heart.vx = Math.abs(heart.vx) * 0.85;
                    heart.x = table.x - heart.width;
                    heart.bounces++;
                    playSound('bounce');
                } else if (minDist === distToRight) {
                    // Hit right edge - bounce left
                    heart.vx = -Math.abs(heart.vx) * 0.85;
                    heart.x = table.x + table.width;
                    heart.bounces++;
                    playSound('bounce');
                } else if (minDist === distToTop) {
                    // Hit top edge - bounce down
                    heart.vy = Math.abs(heart.vy) * 0.85;
                    heart.y = table.y - heart.height;
                    heart.bounces++;
                    playSound('bounce');
                } else {
                    // Hit bottom edge - bounce up
                    heart.vy = -Math.abs(heart.vy) * 0.85;
                    heart.y = table.y + table.height;
                    heart.bounces++;
                    playSound('bounce');
                }
                
                // Add some randomness to the bounce to make it more realistic
                heart.vx += (Math.random() - 0.5) * 0.3;
                heart.vy += (Math.random() - 0.5) * 0.3;
                
                // Ensure minimum velocity to prevent hearts from getting stuck
                const minVelocity = 0.5;
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