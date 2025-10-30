import { createTheme, MantineColorsTuple } from '@mantine/core';

export const theme = createTheme({
  colorScheme: 'light',
  primaryColor: 'blue',
  primaryShade: 6,

  // Indonesian government color scheme
  colors: {
    blue: [
      '#e6f3ff', // 50
      '#dbeafe', // 100
      '#bfdbfe', // 200
      '#93c5fd', // 300
      '#60a5fa', // 400
      '#3b82f6', // 500
      '#2563eb', // 600
      '#1d4ed8', // 700
      '#1e40af', // 800
      '#1e3a8a', // 900
    ] as MantineColorsTuple,
    brand: [
      '#c77dff', // Primary brand - Indonesian flag red
      '#ff6b6b', // Secondary
      '#4ecdc4', // Success
      '#ffd43b', // Warning
      '#ff6b9d', // Info
      '#228be6', // Government blue
    ] as MantineColorsTuple,
  },

  // Typography for Indonesian government content
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", Arial',
  fontFamilyMonospace: '"JetBrains Mono", Consolas, Menlo, monospace',
  headings: {
    fontFamily: '"Inter", sans-serif',
    fontWeight: '600',
    sizes: {
      h1: { fontSize: '2.5rem', fontWeight: '700' },
      h2: { fontSize: '2rem', fontWeight: '600' },
      h3: { fontSize: '1.75rem', fontWeight: '600' },
      h4: { fontSize: '1.5rem', fontWeight: '600' },
      h5: { fontSize: '1.25rem', fontWeight: '600' },
      h6: { fontSize: '1.125rem', fontWeight: '600' },
    },
  },

  // Spacing for government forms
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },

  // Radius for modern UI
  radius: {
    xs: '0.125rem',
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
  },

  // Shadows for depth
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0.05)',
    sm: '0 1px 3px rgba(0, 0, 0.07), 0 2px 5px rgba(0, 0, 0.03)',
    md: '0 4px 6px rgba(0, 0, 0.07), 0 1px 3px rgba(0, 0, 0.03)',
    lg: '0 7px 14px rgba(0, 0, 0.1), 0 2px 6px rgba(0, 0, 0.05)',
    xl: '0 14px 28px rgba(0, 0, 0.15)',
  },

  // Components
  components: {
    Button: {
      styles: (theme) => ({
        root: {
          border: `2px solid ${theme.colors.blue[6]}`,
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
          fontWeight: 600,
          '&:hover': {
            backgroundColor: theme.colors.blue[7],
            border: `2px solid ${theme.colors.blue[7]}`,
          },
          '&:active': {
            backgroundColor: theme.colors.blue[8],
            border: `2px solid ${theme.colors.blue[8]}`,
          },
        },
      }),
    },
    Card: {
      styles: (theme) => ({
        root: {
          backgroundColor: theme.white,
          border: `1px solid ${theme.colors.gray[3]}`,
          boxShadow: theme.shadows.sm,
        },
      }),
    },
    Input: {
      styles: (theme) => ({
        input: {
          border: `1px solid ${theme.colors.gray[4]}`,
          backgroundColor: theme.white,
          '&:focus': {
            borderColor: theme.colors.blue[6],
            boxShadow: `0 0 0 4px ${theme.colors.blue[1]}`,
          },
        },
      }),
    },
    Table: {
      styles: (theme) => ({
        root: {
          backgroundColor: theme.white,
        },
        th: {
          backgroundColor: theme.colors.gray[0],
          fontWeight: 600,
          color: theme.colors.gray[9],
        },
        td: {
          borderBottom: `1px solid ${theme.colors.gray[2]}`,
        },
        tr: {
          '&:hover': {
            backgroundColor: theme.colors.gray[0],
          },
        },
      }),
    },
    Modal: {
      styles: (theme) => ({
        root: {
          boxShadow: theme.shadows.xl,
        },
        header: {
          backgroundColor: theme.colors.blue[6],
          color: theme.white,
          fontWeight: 600,
        },
        title: {
          fontWeight: 600,
        },
      }),
    },
    AppShell: {
      styles: (theme) => ({
        root: {
          backgroundColor: theme.colors.gray[0],
        },
        navbar: {
          backgroundColor: theme.white,
          borderBottom: `1px solid ${theme.colors.gray[3]}`,
        },
      }),
    },
  },
});

export default theme;