"use client";
import { Providers } from "@/components/Providers";
import SpriteLoader from "@/components/SpriteLoader";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <SpriteLoader />
      {children}
    </Providers>
  );
}
