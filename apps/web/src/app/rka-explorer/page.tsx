import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { RkaExplorer } from '@/components/rka-explorer/RkaExplorer';
import { RkaExplorerSkeleton } from '@/components/rka-explorer/RkaExplorerSkeleton';

export default async function RkaExplorerPage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">RKA Explorer</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Browse and search through all RKA documents in your organization.
        </p>
      </div>
      
      <Suspense fallback={<RkaExplorerSkeleton />}>
        <RkaExplorer />
      </Suspense>
    </div>
  );
}
