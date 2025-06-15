import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Named export for cn utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
