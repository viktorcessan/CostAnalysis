import { writable } from 'svelte/store';

export type Currency = 'USD' | 'EUR' | 'SEK' | 'GBP';

interface CurrencyConfig {
  symbol: string;
  multiplier: number;
  code: Currency;
}

export const currencyConfigs: Record<Currency, CurrencyConfig> = {
  USD: {
    symbol: '$',
    multiplier: 1,
    code: 'USD'
  },
  EUR: {
    symbol: '€',
    multiplier: 1, // Approximate EUR/USD rate
    code: 'EUR'
  },
  SEK: {
    symbol: 'kr',
    multiplier: 10, // Approximate SEK/USD rate
    code: 'SEK'
  },
  GBP: {
    symbol: '£',
    multiplier: 1, // Approximate GBP/USD rate
    code: 'GBP'
  }
};

function createCurrencyStore() {
  const { subscribe, set, update } = writable<CurrencyConfig>(currencyConfigs.USD);

  return {
    subscribe,
    setCurrency: (currency: Currency) => set(currencyConfigs[currency]),
    getCurrentConfig: () => {
      let current: CurrencyConfig;
      subscribe(value => { current = value; })();
      return current!;
    }
  };
}

export const currencyStore = createCurrencyStore(); 