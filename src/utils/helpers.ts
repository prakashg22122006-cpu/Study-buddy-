/**
 * Currency and Date Formatting Utilities
 * Provides helper functions for formatting currency values and dates
 */

/**
 * Formats a number as currency
 * @param amount - The numeric amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string => {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${amount.toFixed(2)}`;
  }
};

/**
 * Formats a date object as a readable string
 * @param date - Date object or date string
 * @param format - Format pattern (default: 'YYYY-MM-DD')
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string,
  format: string = 'YYYY-MM-DD'
): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }

    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');

    const replacements: { [key: string]: string } = {
      'YYYY': year.toString(),
      'MM': month,
      'DD': day,
      'HH': hours,
      'mm': minutes,
      'ss': seconds,
    };

    let result = format;
    Object.keys(replacements).forEach((key) => {
      result = result.replace(new RegExp(key, 'g'), replacements[key]);
    });

    return result;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Formats a date as a relative time string (e.g., "2 hours ago")
 * @param date - Date object or date string
 * @returns Relative time string
 */
export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return formatDate(dateObj, 'YYYY-MM-DD');
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Parses a date string and returns a Date object
 * @param dateString - Date string to parse
 * @returns Parsed Date object or null if invalid
 */
export const parseDate = (dateString: string): Date | null => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch (error) {
    console.error('Error parsing date:', error);
    return null;
  }
};

/**
 * Checks if a date is today
 * @param date - Date object or date string
 * @returns True if the date is today, false otherwise
 */
export const isToday = (date: Date | string): boolean => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch (error) {
    console.error('Error checking if date is today:', error);
    return false;
  }
};

/**
 * Gets the difference between two dates in days
 * @param date1 - First date
 * @param date2 - Second date (default: today)
 * @returns Number of days between the dates
 */
export const getDaysDifference = (
  date1: Date | string,
  date2: Date | string = new Date()
): number => {
  try {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    const diffMs = d2.getTime() - d1.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error calculating days difference:', error);
    return 0;
  }
};
