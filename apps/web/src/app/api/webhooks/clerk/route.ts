import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Clerk webhook secret for signature verification
const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SIGNING_SECRET;

// Helper function to verify webhook signature
async function verifyWebhook(request: NextRequest): Promise<any> {
  if (!CLERK_WEBHOOK_SECRET) {
    throw new Error('CLERK_WEBHOOK_SIGNING_SECRET not configured');
  }

  const body = await request.text();
  const svixHeaders = {
    'svix-id': request.headers.get('svix-id')!,
    'svix-timestamp': request.headers.get('svix-timestamp')!,
    'svix-signature': request.headers.get('svix-signature')!,
  };

  const wh = new Webhook(CLERK_WEBHOOK_SECRET);

  try {
    return wh.verify(body, svixHeaders);
  } catch (err) {
    console.error('Webhook verification failed:', err);
    throw new Error('Invalid webhook signature');
  }
}

// Handle user events
async function handleUserEvent(event: any) {
  const { type, data } = event;

  switch (type) {
    case 'user.created':
      await convex.mutation(api.users.syncUser, {
        clerkUserId: data.id,
        email: data.email_addresses[0]?.email_address,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
        organizationId: data.organization_memberships?.[0]?.organization?.id || null,
      });
      break;

    case 'user.updated':
      await convex.mutation(api.users.updateUser, {
        clerkUserId: data.id,
        email: data.email_addresses[0]?.email_address,
        name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || undefined,
      });
      break;

    case 'user.deleted':
      await convex.mutation(api.users.deactivateUser, {
        clerkUserId: data.id,
      });
      break;
  }
}

// Handle organization events
async function handleOrganizationEvent(event: any) {
  const { type, data } = event;

  switch (type) {
    case 'organization.created':
      await convex.mutation(api.organizations.syncOrganization, {
        clerkOrganizationId: data.id,
        name: data.name,
        description: data.description || undefined,
      });
      break;

    case 'organization.updated':
      await convex.mutation(api.organizations.updateOrganization, {
        clerkOrganizationId: data.id,
        name: data.name,
        description: data.description || undefined,
      });
      break;

    case 'organization.deleted':
      await convex.mutation(api.organizations.deactivateOrganization, {
        clerkOrganizationId: data.id,
      });
      break;
  }
}

// Handle organization membership events
async function handleMembershipEvent(event: any) {
  const { type, data } = event;

  switch (type) {
    case 'organizationMembership.created':
      await convex.mutation(api.users.updateUserMembership, {
        clerkUserId: data.user_id,
        organizationId: data.organization.id,
        role: data.role || 'viewer',
      });
      break;

    case 'organizationMembership.deleted':
      await convex.mutation(api.users.removeUserMembership, {
        clerkUserId: data.user_id,
        organizationId: data.organization.id,
      });
      break;
  }
}

// Main webhook handler
export async function POST(request: NextRequest) {
  try {
    const event = await verifyWebhook(request);
    console.log('Webhook received:', event.type);

    // Handle different event types
    if (event.type.startsWith('user.')) {
      await handleUserEvent(event);
    } else if (event.type.startsWith('organization.')) {
      await handleOrganizationEvent(event);
    } else if (event.type.startsWith('organizationMembership.')) {
      await handleMembershipEvent(event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 400 }
    );
  }
}