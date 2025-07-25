import "../globals.css";



// Metadata generation is now handled at the page level in /r/[slug]/page.tsx

export default function PublicPromptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {children}
    </div>
  );
}
