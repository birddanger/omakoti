// Locale-aware formatting helpers.
// The app targets Finnish detached-home owners, so the default currency is EUR.
// Formatting locale follows the active UI language.

export type AppLanguage = 'en' | 'fi';

const LOCALES: Record<AppLanguage, string> = {
  fi: 'fi-FI',
  en: 'en-IE', // English locale that still renders the Euro sensibly
};

const CURRENCY = 'EUR';

/**
 * Format a numeric amount as a currency string for the given language.
 * Whole euros by default (maintenance costs are rarely tracked to the cent).
 */
export const formatCurrency = (
  amount: number | null | undefined,
  language: AppLanguage = 'fi',
  decimals = 0
): string => {
  const value = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat(LOCALES[language], {
    style: 'currency',
    currency: CURRENCY,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

/**
 * Format an ISO date string (YYYY-MM-DD or full ISO) for display.
 * Returns the raw input unchanged if it cannot be parsed.
 */
export const formatDate = (
  isoDate: string | null | undefined,
  language: AppLanguage = 'fi'
): string => {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat(LOCALES[language], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
