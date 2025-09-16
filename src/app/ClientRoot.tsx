"use client";
import SpriteLoader from "@/components/SpriteLoader";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SpriteLoader />
      {children}
    </>
  );
}
