import FiveStarSpinner from './FiveStarSpinner';

export default function AppLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center mt-8">
      <FiveStarSpinner size={24} />
      <div className="mt-4 text-lg text-white font-semibold">Loading…</div>
    </div>
  );
} 