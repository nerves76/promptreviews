/**
 * Prompty Power Game - Marketing Embed Widget
 * Drop this script into any website to embed the game
 * Version: 2.0.0
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
            return 'https://app.promptreviews.app';
        })(),
        width: 1120,
        height: 900, // Base height for game area
        buttonText: '🎮 Play Get Found Online: The Game',
        modalTitle: 'Experience Review Management in Action!',
        mobileMessage: '🖥️ For the best experience, please play on desktop'
    };
    
    // Create embed styles with improved responsive design
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
            position: relative;
            overflow: hidden;
        }
        
        .prompty-game-embed-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .prompty-game-embed-btn:active {
            transform: translateY(0);
            box-shadow: 0 2px 10px rgba(102, 126, 234, 0.3);
        }
        
        .prompty-game-modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 10000;
            backdrop-filter: blur(5px);
            -webkit-backdrop-filter: blur(5px);
        }
        
        .prompty-game-modal-content {
            position: relative;
            width: ${GAME_CONFIG.width}px;
            height: auto;
            min-height: ${GAME_CONFIG.height}px;
            max-width: 95vw;
            max-height: 95vh;
            margin: 2.5vh auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
            overflow: hidden;
            animation: modalFadeIn 0.3s ease-out;
        }
        
        @keyframes modalFadeIn {
            from {
                opacity: 0;
                transform: translateY(-20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .prompty-game-modal-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            position: relative;
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
            background: rgba(255, 255, 255, 0.1);
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
            transition: all 0.3s ease;
        }
        
        .prompty-game-close:hover {
            background: rgba(255, 255, 255, 0.2);
            transform: rotate(90deg);
        }
        
        .prompty-game-iframe {
            width: 100%;
            height: calc(100vh - 120px);
            min-height: ${GAME_CONFIG.height}px;
            border: none;
            display: block;
            background: #000;
        }

        .prompty-game-mobile-notice {
            display: none;
            padding: 15px;
            background: #fff3cd;
            color: #856404;
            border-radius: 6px;
            margin: 10px;
            text-align: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        @media (max-width: 768px) {
            .prompty-game-modal-content {
                width: 100vw;
                height: 100vh;
                max-width: 100vw;
                max-height: 100vh;
                margin: 0;
                border-radius: 0;
            }
            
            .prompty-game-embed-btn {
                padding: 12px 24px;
                font-size: 14px;
            }

            .prompty-game-mobile-notice {
                display: block;
            }

            .prompty-game-iframe {
                height: calc(100vh - 180px);
            }
        }

        @media (max-width: 480px) {
            .prompty-game-modal-header h2 {
                font-size: 20px;
                padding-right: 40px;
            }
        }
    `;
    
    // Inject styles
    function injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = embedStyles;
        document.head.appendChild(styleSheet);
    }
    
    // Create modal HTML with mobile notice
    function createModal() {
        const modal = document.createElement('div');
        modal.className = 'prompty-game-modal';
        modal.id = 'promptyGameModal';
        
        modal.innerHTML = `
            <div class="prompty-game-modal-content">
                <div class="prompty-game-modal-header">
                    <h2>${GAME_CONFIG.modalTitle}</h2>
                    <button class="prompty-game-close" onclick="closePromptyGame()" aria-label="Close game">×</button>
                </div>
                <div class="prompty-game-mobile-notice">
                    ${GAME_CONFIG.mobileMessage}
                </div>
                <iframe 
                    class="prompty-game-iframe"
                    src="${GAME_CONFIG.baseUrl}/prompty-power-game/index.html"
                    title="Get Found Online: The Game"
                    loading="lazy"
                    allow="fullscreen"
                    scrolling="no">
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
    
    // Auto-embed function with improved direct embed
    window.embedPromptyGame = function(targetElement, options = {}) {
        // Merge options with defaults
        const config = Object.assign({}, GAME_CONFIG, options);
        
        // Check if direct embed is requested
        if (options.direct === true) {
            // Create direct iframe embed with responsive wrapper
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'width: 100%; max-width: 1120px; margin: 0 auto;';
            
            const iframe = document.createElement('iframe');
            iframe.src = `${config.baseUrl}/prompty-power-game/index.html`;
            iframe.style.cssText = 'width: 100%; min-height: 1200px; height: 100%; border: none; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); display: block;';
            iframe.title = 'Get Found Online: The Game';
            iframe.loading = 'lazy';
            iframe.allow = 'fullscreen';
            iframe.scrolling = 'auto';
            
            wrapper.appendChild(iframe);
            
            // Add mobile notice for direct embeds
            const mobileNotice = document.createElement('div');
            mobileNotice.className = 'prompty-game-mobile-notice';
            mobileNotice.textContent = config.mobileMessage;
            wrapper.appendChild(mobileNotice);
            
            // Add to target element
            if (typeof targetElement === 'string') {
                targetElement = document.querySelector(targetElement);
            }
            
            if (targetElement) {
                targetElement.appendChild(wrapper);
            } else {
                console.error('Prompty Game Embed: Target element not found');
            }
        } else {
            // Create button (existing behavior)
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
        }
    };
    
    // Initialize when DOM is ready
    function initialize() {
        injectStyles();
        createModal();
        
        // Auto-embed if there's a target element with data attribute
        const autoTarget = document.querySelector('[data-prompty-game]');
        if (autoTarget) {
            // Check if direct embed is requested via data attribute
            const isDirect = autoTarget.hasAttribute('data-prompty-direct');
            embedPromptyGame(autoTarget, { direct: isDirect });
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

// Method 1: Auto-embed button (opens modal)
<div data-prompty-game></div>

// Method 2: Auto-embed direct iframe
<div data-prompty-game data-prompty-direct></div>

// Method 3: Manual embed button
<div id="game-container"></div>
<script>
    embedPromptyGame('#game-container');
</script>

// Method 4: Manual embed direct iframe
<div id="game-container"></div>
<script>
    embedPromptyGame('#game-container', { direct: true });
</script>

// Method 5: Custom button
<button onclick="openPromptyGame()">Play Our Game!</button>

// Method 6: Simple iframe (recommended responsive embed)
<div style="width: 100%; max-width: 1120px; margin: 0 auto;">
    <iframe 
        src="https://app.promptreviews.app/prompty-power-game/index.html" 
        style="width: 100%; min-height: 1200px; height: 100%; border: none; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); display: block;"
        title="Get Found Online: The Game"
        loading="lazy"
        allow="fullscreen"
        scrolling="auto">
    </iframe>
</div>

*/