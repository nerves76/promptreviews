import AppLoader from "@/app/components/AppLoader";

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <AppLoader variant="compact" />
    </div>
  );
}