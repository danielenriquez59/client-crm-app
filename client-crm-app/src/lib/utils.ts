import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Client, getUniqueCompanies } from "./db";

/**
 * Combines multiple class names using clsx and tailwind-merge
 * This is useful for conditional class names in components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a readable string
 * @param date The date to format
 * @param includeTime Whether to include the time in the formatted string
 * @returns A formatted date string
 */
export function formatDate(date: Date | string, includeTime: boolean = false): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  
  return d.toLocaleDateString('en-US', options);
}

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * @param func The function to debounce
 * @param wait The number of milliseconds to delay
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Normalizes a company name for comparison
 * @param company The company name to normalize
 * @returns A normalized company name (trimmed, lowercase)
 */
export function normalizeCompanyName(company: string | undefined | null): string {
  if (!company) return '';
  return company.trim().toLowerCase();
}

/**
 * Finds the closest matching company name from existing companies
 * @param companyName The company name to check
 * @param existingCompanies Array of existing company names
 * @param threshold Similarity threshold (0-1), default 0.85
 * @returns The matching company name or the original if no match found
 */
export async function findMatchingCompany(
  companyName: string | undefined | null,
  existingCompanies?: string[]
): Promise<string> {
  if (!companyName) return '';
  
  const normalizedInput = normalizeCompanyName(companyName);
  if (!normalizedInput) return '';
  
  // Get companies if not provided
  const companies = existingCompanies || await getUniqueCompanies();
  
  // Exact match check (case insensitive)
  const exactMatch = companies.find(
    company => normalizeCompanyName(company) === normalizedInput
  );
  
  if (exactMatch) {
    return exactMatch; // Return the existing company with original casing
  }
  
  return companyName.trim(); // Return original if no match
}
