import { create } from 'zustand';
import { formatDate } from '@easyhotel/shared';

const MAX_HISTORY = 5;

export interface SearchState {
  city: string;
  checkIn: string;
  checkOut: string;
  keyword: string;
  searchHistory: string[];
}

export interface SearchActions {
  setCity: (city: string) => void;
  setCheckIn: (date: string) => void;
  setCheckOut: (date: string) => void;
  setKeyword: (keyword: string) => void;
  setSearch: (params: Partial<Pick<SearchState, 'city' | 'checkIn' | 'checkOut' | 'keyword'>>) => void;
  addHistory: (keyword: string) => void;
  clearHistory: () => void;
}

// 默认入住日期为今天，退房日期为明天
function getDefaultCheckIn(): string {
  return formatDate(new Date());
}

function getDefaultCheckOut(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return formatDate(tomorrow);
}

export const useSearchStore = create<SearchState & SearchActions>((set) => ({
  city: '上海',
  checkIn: getDefaultCheckIn(),
  checkOut: getDefaultCheckOut(),
  keyword: '',
  searchHistory: [],

  setCity: (city) => set({ city }),

  setCheckIn: (checkIn) => set({ checkIn }),

  setCheckOut: (checkOut) => set({ checkOut }),

  setKeyword: (keyword) => set({ keyword }),

  setSearch: (params) => set((state) => ({ ...state, ...params })),

  addHistory: (keyword) =>
    set((state) => {
      if (!keyword.trim()) return state;
      const filtered = state.searchHistory.filter((h) => h !== keyword);
      return {
        searchHistory: [keyword, ...filtered].slice(0, MAX_HISTORY),
      };
    }),

  clearHistory: () => set({ searchHistory: [] }),
}));
