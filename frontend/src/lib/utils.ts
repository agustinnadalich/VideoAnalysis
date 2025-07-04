import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  // If you want to use tailwind-merge with clsx, keep this:
  return twMerge(clsx(inputs));
}
