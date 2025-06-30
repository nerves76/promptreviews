/**
 * AppLoader Component
 * 
 * Global loading spinner component that displays a centered animated five-star spinner
 * and loading text. Positioned consistently about 200px below the header across all pages.
 * 
 * @param size - Size of the spinner (default: 18)
 * @param variant - Layout variant for different page contexts
 *   - 'default' - Standard positioning about 200px below header
 *   - 'centered' - Vertically centered in viewport (for full-page loads)
 *   - 'compact' - Minimal top padding for pages with minimal headers
 */

import FiveStarSpinner from "./FiveStarSpinner";

interface AppLoaderProps {
  size?: number;
  variant?: 'default' | 'centered' | 'compact';
}

export default function AppLoader({ size = 18, variant = 'default' }: AppLoaderProps = {}) {
  const getContainerClasses = () => {
    switch (variant) {
      case 'centered':
        return "min-h-screen flex flex-col items-center justify-center";
      case 'compact':
        return "min-h-screen flex flex-col items-center pt-24";
      case 'default':
      default:
        return "min-h-screen flex flex-col items-center pt-48";
    }
  };

  return (
    <div className={getContainerClasses()}>
      <FiveStarSpinner size={size} />
      <div className="mt-4 text-lg text-white font-semibold">Loading…</div>
    </div>
  );
}
