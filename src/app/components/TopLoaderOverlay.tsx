import AppLoader from "./AppLoader";

export default function TopLoaderOverlay() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center">
      <AppLoader variant="centered" />
    </div>
  );
}
