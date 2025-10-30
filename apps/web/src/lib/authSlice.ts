import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  currentUser: {
    id: string;
    name: string | null;
    email: string;
    role: 'admin' | 'pptk' | 'bendahara' | 'verifikator' | 'viewer';
    organizationId: string;
    organizationName: string | null;
  } | null;
  isSwitchingOrganization: boolean;
}

const initialState: AuthState = {
  currentUser: null,
  isSwitchingOrganization: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // User management
    setCurrentUser: (state, action: PayloadAction<AuthState['currentUser']>) => {
      state.currentUser = action.payload;
    },
    updateUserProfile: (state, action: PayloadAction<Partial<AuthState['currentUser']>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload };
      }
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },

    // Organization switching
    startOrganizationSwitch: (state) => {
      state.isSwitchingOrganization = true;
    },
    completeOrganizationSwitch: (state) => {
      state.isSwitchingOrganization = false;
    },
  },
});

export const {
  setCurrentUser,
  updateUserProfile,
  clearCurrentUser,
  startOrganizationSwitch,
  completeOrganizationSwitch,
} = authSlice.actions;

export default authSlice.reducer;