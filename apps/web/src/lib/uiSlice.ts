import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface UIState {
  // Sidebar and navigation
  sidebarOpen: boolean;
  activeNav: string;

  // Modals and overlays
  createNpdModalOpen: boolean;
  rkaFiltersModalOpen: boolean;
  userSettingsModalOpen: boolean;

  // Loading states
  loading: {
    npd: boolean;
    rka: boolean;
    auth: boolean;
  };

  // Theme and preferences
  theme: 'light' | 'dark';
  fiscalYear: number;
  organizationId: string | null;
}

const initialState: UIState = {
  sidebarOpen: true,
  activeNav: 'dashboard',
  createNpdModalOpen: false,
  rkaFiltersModalOpen: false,
  userSettingsModalOpen: false,
  loading: {
    npd: false,
    rka: false,
    auth: false,
  },
  theme: 'light',
  fiscalYear: new Date().getFullYear(),
  organizationId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar actions
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // Navigation actions
    setActiveNav: (state, action: PayloadAction<string>) => {
      state.activeNav = action.payload;
    },

    // Modal actions
    openCreateNpdModal: (state) => {
      state.createNpdModalOpen = true;
    },
    closeCreateNpdModal: (state) => {
      state.createNpdModalOpen = false;
    },
    openRkaFiltersModal: (state) => {
      state.rkaFiltersModalOpen = true;
    },
    closeRkaFiltersModal: (state) => {
      state.rkaFiltersModalOpen = false;
    },
    openUserSettingsModal: (state) => {
      state.userSettingsModalOpen = true;
    },
    closeUserSettingsModal: (state) => {
      state.userSettingsModalOpen = false;
    },

    // Loading actions
    setLoading: (state, action: PayloadAction<{key: keyof UIState['loading'], value: boolean}>) => {
      state.loading[action.payload.key] = action.payload.value;
    },

    // Theme and preferences
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    setFiscalYear: (state, action: PayloadAction<number>) => {
      state.fiscalYear = action.payload;
    },
    setOrganizationId: (state, action: PayloadAction<string | null>) => {
      state.organizationId = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setActiveNav,
  openCreateNpdModal,
  closeCreateNpdModal,
  openRkaFiltersModal,
  closeRkaFiltersModal,
  openUserSettingsModal,
  closeUserSettingsModal,
  setLoading,
  setTheme,
  setFiscalYear,
  setOrganizationId,
} = uiSlice.actions;

export default uiSlice.reducer;