import { renderHook } from '@testing-library/react';
import { usePermissions } from '@/hooks/usePermissions';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { store } from '@/lib/store';

// Mock the auth slice
const mockStore = configureStore({
  reducer: {
    auth: (state = { currentUser: null }, action) => {
      switch (action.type) {
        case 'SET_USER':
          return { ...state, currentUser: action.payload };
        default:
          return state;
      }
    },
    ui: (state = {}, action) => state,
    filters: (state = {}, action) => state,
  },
});

const createWrapper = (user: any) => {
  mockStore.dispatch({ type: 'SET_USER', payload: user });
  return ({ children }: { children: React.ReactNode }) => (
    <Provider store={mockStore}>
      {children}
    </Provider>
  );
};

describe('usePermissions', () => {
  it('should return correct permissions for admin role', () => {
    const adminUser = {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'admin',
      organizationId: 'org1',
    };

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(adminUser),
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canCreateRKA).toBe(true);
    expect(result.current.canCreateNPD).toBe(true);
    expect(result.current.canVerifyNPD).toBe(true);
    expect(result.current.canApproveNPD).toBe(true);
    expect(result.current.canManageUsers).toBe(true);
  });

  it('should return correct permissions for PPTK role', () => {
    const pptkUser = {
      id: '2',
      name: 'PPTK User',
      email: 'pptk@example.com',
      role: 'pptk',
      organizationId: 'org1',
    };

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(pptkUser),
    });

    expect(result.current.isPPTK).toBe(true);
    expect(result.current.canCreateRKA).toBe(true);
    expect(result.current.canCreateNPD).toBe(true);
    expect(result.current.canVerifyNPD).toBe(false);
    expect(result.current.canApproveNPD).toBe(false);
    expect(result.current.canManageUsers).toBe(false);
  });

  it('should return correct permissions for bendahara role', () => {
    const bendaharaUser = {
      id: '3',
      name: 'Bendahara User',
      email: 'bendahara@example.com',
      role: 'bendahara',
      organizationId: 'org1',
    };

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(bendaharaUser),
    });

    expect(result.current.isBendahara).toBe(true);
    expect(result.current.canCreateRKA).toBe(false);
    expect(result.current.canCreateNPD).toBe(true);
    expect(result.current.canVerifyNPD).toBe(true);
    expect(result.current.canApproveNPD).toBe(false);
    expect(result.current.canManageUsers).toBe(false);
  });

  it('should return correct permissions for verifikator role', () => {
    const verifikatorUser = {
      id: '4',
      name: 'Verifikator User',
      email: 'verifikator@example.com',
      role: 'verifikator',
      organizationId: 'org1',
    };

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(verifikatorUser),
    });

    expect(result.current.isVerifikator).toBe(true);
    expect(result.current.canCreateRKA).toBe(false);
    expect(result.current.canCreateNPD).toBe(false);
    expect(result.current.canVerifyNPD).toBe(true);
    expect(result.current.canApproveNPD).toBe(true);
    expect(result.current.canManageUsers).toBe(false);
  });

  it('should return correct permissions for viewer role', () => {
    const viewerUser = {
      id: '5',
      name: 'Viewer User',
      email: 'viewer@example.com',
      role: 'viewer',
      organizationId: 'org1',
    };

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(viewerUser),
    });

    expect(result.current.isViewer).toBe(true);
    expect(result.current.canCreateRKA).toBe(false);
    expect(result.current.canCreateNPD).toBe(false);
    expect(result.current.canVerifyNPD).toBe(false);
    expect(result.current.canApproveNPD).toBe(false);
    expect(result.current.canViewReports).toBe(true);
    expect(result.current.canManageUsers).toBe(false);
  });

  it('should return false permissions when no user is logged in', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(null),
    });

    expect(result.current.role).toBeUndefined();
    expect(result.current.canCreateRKA).toBe(false);
    expect(result.current.canCreateNPD).toBe(false);
    expect(result.current.canVerifyNPD).toBe(false);
    expect(result.current.canApproveNPD).toBe(false);
  });

  it('should correctly check generic permissions', () => {
    const pptkUser = {
      id: '2',
      name: 'PPTK User',
      email: 'pptk@example.com',
      role: 'pptk',
      organizationId: 'org1',
    };

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(pptkUser),
    });

    expect(result.current.hasPermission('create', 'rka')).toBe(true);
    expect(result.current.hasPermission('delete', 'rka')).toBe(true);
    expect(result.current.hasPermission('verify', 'npd')).toBe(false);
    expect(result.current.hasPermission('manage', 'users')).toBe(false);
  });
});
