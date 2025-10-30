import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface FilterState {
  rka: {
    searchQuery: string;
    fiscalYear: number | null;
    status: string | null;
    programId: string | null;
    kegiatanId: string | null;
    subkegiatanId: string | null;
  };
  npd: {
    searchQuery: string;
    status: string | null;
    tahun: number | null;
    jenis: string | null;
  };
  performance: {
    periode: string | null;
    subkegiatanId: string | null;
    indikatorType: string | null;
  };
}

const initialState: FilterState = {
  rka: {
    searchQuery: '',
    fiscalYear: null,
    status: null,
    programId: null,
    kegiatanId: null,
    subkegiatanId: null,
  },
  npd: {
    searchQuery: '',
    status: null,
    tahun: null,
    jenis: null,
  },
  performance: {
    periode: null,
    subkegiatanId: null,
    indikatorType: null,
  },
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // RKA filters
    setRkaSearchQuery: (state, action: PayloadAction<string>) => {
      state.rka.searchQuery = action.payload;
    },
    setRkaFiscalYear: (state, action: PayloadAction<number | null>) => {
      state.rka.fiscalYear = action.payload;
    },
    setRkaStatus: (state, action: PayloadAction<string | null>) => {
      state.rka.status = action.payload;
    },
    setRkaProgramId: (state, action: PayloadAction<string | null>) => {
      state.rka.programId = action.payload;
    },
    setRkaKegiatanId: (state, action: PayloadAction<string | null>) => {
      state.rka.kegiatanId = action.payload;
    },
    setRkaSubkegiatanId: (state, action: PayloadAction<string | null>) => {
      state.rka.subkegiatanId = action.payload;
    },
    clearRkaFilters: (state) => {
      state.rka = initialState.rka;
    },

    // NPD filters
    setNpdSearchQuery: (state, action: PayloadAction<string>) => {
      state.npd.searchQuery = action.payload;
    },
    setNpdStatus: (state, action: PayloadAction<string | null>) => {
      state.npd.status = action.payload;
    },
    setNpdTahun: (state, action: PayloadAction<number | null>) => {
      state.npd.tahun = action.payload;
    },
    setNpdJenis: (state, action: PayloadAction<string | null>) => {
      state.npd.jenis = action.payload;
    },
    clearNpdFilters: (state) => {
      state.npd = initialState.npd;
    },

    // Performance filters
    setPerformancePeriode: (state, action: PayloadAction<string | null>) => {
      state.performance.periode = action.payload;
    },
    setPerformanceSubkegiatanId: (state, action: PayloadAction<string | null>) => {
      state.performance.subkegiatanId = action.payload;
    },
    setPerformanceIndikatorType: (state, action: PayloadAction<string | null>) => {
      state.performance.indikatorType = action.payload;
    },
    clearPerformanceFilters: (state) => {
      state.performance = initialState.performance;
    },

    // Clear all filters
    clearAllFilters: (state) => {
      state.rka = initialState.rka;
      state.npd = initialState.npd;
      state.performance = initialState.performance;
    },
  },
});

export const {
  setRkaSearchQuery,
  setRkaFiscalYear,
  setRkaStatus,
  setRkaProgramId,
  setRkaKegiatanId,
  setRkaSubkegiatanId,
  clearRkaFilters,
  setNpdSearchQuery,
  setNpdStatus,
  setNpdTahun,
  setNpdJenis,
  clearNpdFilters,
  setPerformancePeriode,
  setPerformanceSubkegiatanId,
  setPerformanceIndikatorType,
  clearPerformanceFilters,
  clearAllFilters,
} = filtersSlice.actions;

export default filtersSlice.reducer;