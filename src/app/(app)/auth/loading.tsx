import AppLoader from "@/app/(app)/components/AppLoader";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AppLoader variant="compact" />
      <p className="mt-4 text-gray-600 text-sm">Completing authentication...</p>
    </div>
  );
}