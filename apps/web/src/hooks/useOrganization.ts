'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useOrganization() {
  const organization = useQuery(api.organizations.getCurrent);
  
  return {
    organization: organization ?? null,
    isLoading: organization === undefined,
  };
}

