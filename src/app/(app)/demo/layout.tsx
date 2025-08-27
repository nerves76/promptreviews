/**
 * Minimal layout for demo pages
 * No navigation, no footer, just the content
 */

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}