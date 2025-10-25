import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date to display only hours and minutes (HH:MM)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted time string in HH:MM format
 */
export function formatTimeOnly(date: string | Date | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    return dateObj.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false // Use 24-hour format for consistency
    });
  } catch {
    return '';
  }
}

/**
 * Format a date to display date and time (only hours and minutes)
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date and time string
 */
export function formatDateTimeOnly(date: string | Date | number): string {
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return '';
    }
    
    const dateStr = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    
    const timeStr = formatTimeOnly(dateObj);
    
    return `${dateStr}, ${timeStr}`;
  } catch {
    return '';
  }
}
