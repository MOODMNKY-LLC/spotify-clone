import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Auth forms: darker background and visible border so inputs stand out on neutral-800 card. Use with Input. */
export const AUTH_INPUT_CLASS =
  "!bg-[#171717] border border-neutral-600 text-white placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-neutral-500"
