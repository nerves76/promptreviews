/**
 * Prompty Power Game - Marketing Embed Widget
 * Drop this script into any website to embed the game
 */

(function() {
    'use strict';
    
    // Configuration - Auto-detect domain or use fallback
    const GAME_CONFIG = {
        baseUrl: (function() {
            // Auto-detect if we're being loaded from the same domain
            const script = document.currentScript;
            if (script && script.src) {
                const url = new URL(script.src);
                return `${url.protocol}//${url.host}`;
            }
            // Fallback to your production domain
            return 'https://promptreviews.app';
        })(),
        width: 900,
        height: 750, // Increased to accommodate marketing content
        buttonText: '🎮 Play Get Found Online: The Game',
        modalTitle: 'Experience Review Management in Action!'
    };
    
    // Create embed styles
    const embedStyles = `
        .prompty-game-embed-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 16px;
            font-weight: 600;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .prompty-game-embed-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .prompty-game-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            backdrop-filter: blur(5px);
        }
        
        .prompty-game-modal-content {
            position: relative;
            width: ${GAME_CONFIG.width}px;
            height: ${GAME_CONFIG.height}px;
            max-width: 95vw;
            max-height: 95vh;
            margin: 2.5vh auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            overflow: hidden;
        }
        
        .prompty-game-modal-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .prompty-game-modal-header h2 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        
        .prompty-game-close {
            position: absolute;
            top: 15px;
            right: 20px;
            background: none;
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background 0.3s ease;
        }
        
        .prompty-game-close:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        .prompty-game-iframe {
            width: 100%;
            height: calc(100% - 80px);
            border: none;
        }
        
        @media (max-width: 768px) {
            .prompty-game-modal-content {
                width: 95vw;
                height: 95vh;
                margin: 2.5vh auto;
            }
            
            .prompty-game-embed-btn {
                padding: 12px 24px;
                font-size: 14px;
            }
        }
    `;
    
    // Inject styles
    function injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = embedStyles;
        document.head.appendChild(styleSheet);
    }
    
    // Create modal HTML
    function createModal() {
        const modal = document.createElement('div');
        modal.className = 'prompty-game-modal';
        modal.id = 'promptyGameModal';
        
        modal.innerHTML = `
            <div class="prompty-game-modal-content">
                <div class="prompty-game-modal-header">
                    <h2>${GAME_CONFIG.modalTitle}</h2>
                    <button class="prompty-game-close" onclick="closePromptyGame()">×</button>
                </div>
                <iframe 
                    class="prompty-game-iframe"
                    src="${GAME_CONFIG.baseUrl}/prompty-power-game/index.html"
                    title="Get Found Online: The Game">
                </iframe>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking outside
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePromptyGame();
            }
        });
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                closePromptyGame();
            }
        });
    }
    
    // Global functions
    window.openPromptyGame = function() {
        const modal = document.getElementById('promptyGameModal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // Analytics tracking
            if (window.gtag) {
                gtag('event', 'game_opened', {
                    event_category: 'Engagement',
                    event_label: 'Get Found Online: The Game'
                });
            }
        }
    };
    
    window.closePromptyGame = function() {
        const modal = document.getElementById('promptyGameModal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    };
    
    // Auto-embed function
    window.embedPromptyGame = function(targetElement, options = {}) {
        // Merge options with defaults
        const config = Object.assign({}, GAME_CONFIG, options);
        
        // Create button
        const button = document.createElement('button');
        button.className = 'prompty-game-embed-btn';
        button.textContent = config.buttonText;
        button.onclick = window.openPromptyGame;
        
        // Add to target element
        if (typeof targetElement === 'string') {
            targetElement = document.querySelector(targetElement);
        }
        
        if (targetElement) {
            targetElement.appendChild(button);
        } else {
            console.error('Prompty Game Embed: Target element not found');
        }
    };
    
    // Initialize when DOM is ready
    function initialize() {
        injectStyles();
        createModal();
        
        // Auto-embed if there's a target element with data attribute
        const autoTarget = document.querySelector('[data-prompty-game]');
        if (autoTarget) {
            embedPromptyGame(autoTarget);
        }
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();

// Usage Examples:
/*

// Method 1: Auto-embed (just add data attribute to any element)
<div data-prompty-game></div>

// Method 2: Manual embed
<div id="game-container"></div>
<script>
    embedPromptyGame('#game-container');
</script>

// Method 3: Custom button
<button onclick="openPromptyGame()">Play Our Game!</button>

// Method 4: Inline iframe (always visible)
    <iframe src="https://promptreviews.app/prompty-power-game/index.html" 
        width="900" height="750" frameborder="0"></iframe>

*/