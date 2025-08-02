'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/Icon';

export default function TestMobilePage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Test Header */}
      <header className="bg-blue-600 text-white p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Mobile Menu Test</h1>
          
          {/* Desktop Menu */}
          <nav className="hidden md:flex space-x-4">
            <a href="#" className="hover:text-blue-200">Home</a>
            <a href="#" className="hover:text-blue-200">About</a>
            <a href="#" className="hover:text-blue-200">Contact</a>
          </nav>
          
          {/* Mobile Hamburger Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Open menu"
            >
                             {menuOpen ? (
                 <Icon name="FaTimes" className="h-6 w-6" size={24} />
               ) : (
                 <Icon name="FaBars" className="h-6 w-6" size={24} />
               )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && typeof window !== 'undefined' && createPortal(
        <div className="fixed inset-0 md:hidden" style={{ zIndex: 9999 }}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={() => setMenuOpen(false)}
          />
          {/* Menu Content */}
          <div className="absolute top-20 left-4 right-4 bg-white rounded-lg shadow-lg p-4">
            <nav className="space-y-2">
              <a href="#" className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded">
                Home
              </a>
              <a href="#" className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded">
                About
              </a>
              <a href="#" className="block py-2 px-3 text-gray-700 hover:bg-gray-100 rounded">
                Contact
              </a>
            </nav>
          </div>
        </div>,
        document.body
      )}

      {/* Main Content */}
      <main className="p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Mobile Menu Test Page</h2>
          
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>Resize your browser window to mobile width (&lt; 768px)</li>
              <li>You should see a hamburger menu icon (☰) in the top right</li>
              <li>Click the hamburger icon to open the mobile menu</li>
              <li>The menu should appear as an overlay</li>
              <li>Click outside the menu or the X icon to close it</li>
            </ol>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Current Screen Info:</h3>
            <div className="space-y-2 text-gray-700">
              <p>Window Width: <span id="window-width" className="font-mono">-</span>px</p>
              <p>Tailwind Breakpoint: <span id="breakpoint" className="font-mono">-</span></p>
              <p>Menu State: <span className="font-mono">{menuOpen ? 'Open' : 'Closed'}</span></p>
            </div>
          </div>
        </div>
      </main>

      {/* Screen size detector script */}
      <script dangerouslySetInnerHTML={{
        __html: `
          function updateScreenInfo() {
            const width = window.innerWidth;
            const widthElement = document.getElementById('window-width');
            const breakpointElement = document.getElementById('breakpoint');
            
            if (widthElement) widthElement.textContent = width;
            
            if (breakpointElement) {
              if (width < 640) breakpointElement.textContent = 'xs (<640px)';
              else if (width < 768) breakpointElement.textContent = 'sm (640-767px)';
              else if (width < 1024) breakpointElement.textContent = 'md (768-1023px)';
              else if (width < 1280) breakpointElement.textContent = 'lg (1024-1279px)';
              else breakpointElement.textContent = 'xl (>=1280px)';
            }
          }
          
          if (typeof window !== 'undefined') {
            updateScreenInfo();
            window.addEventListener('resize', updateScreenInfo);
          }
        `
      }} />
    </div>
  );
} 