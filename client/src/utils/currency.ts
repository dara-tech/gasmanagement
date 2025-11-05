/**
 * Currency conversion utilities
 */

// Get exchange rate from localStorage or default
export const getExchangeRate = (): number => {
  const saved = localStorage.getItem('exchangeRate');
  return saved ? parseFloat(saved) || 4000 : 4000;
};

// Convert USD to Riel
export const usdToRiel = (usd: number, exchangeRate?: number): number => {
  const rate = exchangeRate || getExchangeRate();
  return usd * rate;
};

// Convert Riel to USD
export const rielToUsd = (riel: number, exchangeRate?: number): number => {
  const rate = exchangeRate || getExchangeRate();
  return riel / rate;
};

// Format price with both USD and Riel
export const formatPriceWithRiel = (usdPrice: number, exchangeRate?: number): string => {
  if (!usdPrice || usdPrice <= 0) return '';
  const rielPrice = usdToRiel(usdPrice, exchangeRate);
  return `៛${rielPrice.toFixed(0)}`;
};

// Format price display with both currencies
export const formatPriceDisplay = (usdPrice: number, exchangeRate?: number, primaryCurrency: 'USD' | 'KHR' = 'USD'): { usd: string; riel: string; primary: string; secondary: string } => {
  const rate = exchangeRate || getExchangeRate();
  const rielAmount = usdToRiel(usdPrice, rate);
  
  // Format Riel with thousand separators
  const formattedRiel = rielAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  const usd = `$${usdPrice.toFixed(2)}`;
  const riel = `៛${formattedRiel}`;
  
  return {
    usd,
    riel,
    primary: primaryCurrency === 'KHR' ? riel : usd,
    secondary: primaryCurrency === 'KHR' ? usd : riel
  };
};

