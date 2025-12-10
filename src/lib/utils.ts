import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge conditional className inputs with Tailwind-aware conflict resolution.
 * @param {...ClassValue} inputs Class name fragments or conditionals to merge.
 * @returns {string} A space-delimited class string with Tailwind precedence applied.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
