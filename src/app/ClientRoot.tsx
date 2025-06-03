"use client";
import { Providers } from "@/components/Providers";

export default function ClientRoot({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
