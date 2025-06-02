import AppLoader from './AppLoader';

export default function TopLoaderOverlay() {
  return (
    <div className="fixed left-0 w-full z-[9999] flex flex-col items-center" style={{ top: 109 }}>
      <AppLoader />
    </div>
  );
} 