import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isActiveLink(pathname: string, href: string) {
  if (href === '/dashboard' || href === '/admin') return pathname === href
  return pathname.startsWith(href)
}