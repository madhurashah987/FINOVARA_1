import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDisplayName(email?: string | null, fullName?: string | null): string {
  if (fullName && fullName !== 'Authenticated User') return fullName;
  if (!email) return 'Authenticated User';

  const username = email.split('@')[0];
  return username
    .split(/[\._-]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
