/**
 * Game Page
 * 
 * Embeds the Prompty Power game with proper styling and app integration.
 * Provides a fun break for users while maintaining the app's design language.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import FiveStarSpinner from "../components/FiveStarSpinner";

export default function GamePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [gameLoaded, setGameLoaded] = useState(false);

  useEffect(() => {
    // Initialize game after component mounts
    const timer = setTimeout(() => {
      setGameLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600 flex items-center justify-center">
        <FiveStarSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-800 via-purple-700 to-fuchsia-600">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-4">
          {/* Game Container */}
          <div className="relative">
            {!gameLoaded && (
              <div className="absolute inset-0 bg-slate-100 rounded-lg flex items-center justify-center z-10">
                <div className="text-center">
                  <FiveStarSpinner />
                  <p className="mt-4 text-slate-600">Loading Prompty Power...</p>
                </div>
              </div>
            )}
            
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Direct game content */}
              <div className="w-full h-[700px] border-0 relative overflow-hidden">
                <iframe
                  src="/prompty-power-game/index.html"
                  className="w-full h-full border-0"
                  title="Prompty Power Game"
                  onLoad={() => {
                    console.log('Game iframe loaded successfully');
                    setGameLoaded(true);
                  }}
                  onError={(e) => {
                    console.error('Game iframe failed to load:', e);
                  }}
                  onLoadStart={() => {
                    console.log('Game iframe starting to load...');
                  }}
                  allow="autoplay; fullscreen; microphone; camera"
                  style={{ 
                    border: 'none',
                    width: '100%',
                    height: '100%',
                    display: 'block',
                    overflow: 'hidden'
                  }}
                  scrolling="no"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 