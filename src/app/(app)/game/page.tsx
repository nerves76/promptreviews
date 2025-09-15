/**
 * Game Page
 * 
 * Embeds Get Found Online: The Game with proper styling and app integration.
 * Provides a fun break for users while maintaining the app's design language.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/auth";
import { useGlobalLoader } from "../components/GlobalLoaderProvider";
import { useCancelledAccountGuard } from "@/utils/useCancelledAccountGuard";

export default function GamePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [gameLoaded, setGameLoaded] = useState(false);
  const loader = useGlobalLoader();
  
  // Block cancelled accounts from accessing the game
  const { isBlocked } = useCancelledAccountGuard();

  useEffect(() => {
    // Initialize game after component mounts
    const timer = setTimeout(() => {
      setGameLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (authLoading) { loader.show('game'); return null; }
  loader.hide('game');

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Game Container */}
          <div className="relative">
            {!gameLoaded && loader.show('game-iframe')}
            {gameLoaded && loader.hide('game-iframe')}
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Direct game content */}
              <div className="w-full h-[1600px] border-0 relative overflow-auto">
                <iframe
                  src="/prompty-power-game/index.html"
                  className="w-full h-full border-0"
                  title="Get Found Online: The Game"
                  onLoad={() => {
                    setGameLoaded(true);
                  }}
                  onError={(e) => {
                    console.error('Game iframe failed to load:', e);
                  }}
                  onLoadStart={() => {
                  }}
                  allow="autoplay; fullscreen; microphone; camera"
                  style={{ 
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    overflow: 'auto'
                  }}
                  scrolling="yes"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
