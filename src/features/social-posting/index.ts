/**
 * Social Media Posting Feature - Main Exports
 * 
 * Platform-agnostic social media posting system with support for multiple platforms
 */

// Core universal functionality
export * from './core/types/platform';
export * from './core/services/PostManager';

// Platform-specific integrations
export * from './platforms';

// Components (universal posting interface)
export * from './components';

// Hooks
export * from './hooks';

// Utils
export * from './utils'; 