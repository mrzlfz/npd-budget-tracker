'use client';

import React from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import { DatesProvider } from '@mantine/dates';

import { store } from '@/lib/store';
import theme from '@/lib/mantine/theme';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ReduxProvider store={store}>
      <MantineProvider theme={theme}>
        <ModalsProvider>
          <DatesProvider settings={{ locale: 'id-ID' }}>
            <Notifications position="top-right" />
            {children}
          </DatesProvider>
        </ModalsProvider>
      </MantineProvider>
    </ReduxProvider>
  );
}

export default AppProviders;