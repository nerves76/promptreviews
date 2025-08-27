'use client'

// Re-export the existing component for now
// This allows us to gradually refactor without breaking existing imports
export { default } from '../AnimatedInfographic'

// Export new modular components as they're ready
export { default as Features } from './Features'
export { default as CustomerSection } from './CustomerSection'