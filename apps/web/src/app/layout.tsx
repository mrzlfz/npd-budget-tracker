import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { ConvexClientProvider } from '@/components/ConvexClientProvider'
import AppProviders from '@/components/providers/AppProviders'
import { AppShell, useMantineTheme } from '@mantine/core'
import { Navigation } from '@/components/layout/Navigation'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NPD Tracker',
  description: 'Nota Pencairan Dana & Rencana Kerja dan Anggaran tracking application',
}

function AppShellLayout({ children }: { children: React.ReactNode }) {
  const theme = useMantineTheme()

  return (
    <AppShell
      padding="md"
      navbar={{
        width: 280,
        breakpoint: 'sm',
      }}
      themeOverride={theme}
    >
      <Navigation onLogout={() => {
        // Handle logout - Clerk will handle this automatically
        console.log('Logging out...')
      }} />
      <AppShell.Main>
        {children}
      </AppShell.Main>
    </AppShell>
  )
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <AppProviders>
        <html lang="id">
          <body className={inter.className}>
            <ConvexClientProvider>
              <AppShellLayout>
                {children}
              </AppShellLayout>
            </ConvexClientProvider>
          </body>
        </html>
      </AppProviders>
    </ClerkProvider>
  )
}