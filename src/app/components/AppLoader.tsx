import FiveStarSpinner from "../(app)/components/FiveStarSpinner";

export default function AppLoader({ size = 24 }: { size?: number } = {}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center -mt-24">
      <FiveStarSpinner size={size} />
      <div className="mt-4 text-lg text-white font-semibold">Loading…</div>
    </div>
  );
}
