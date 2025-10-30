import { createEnv } from "@t3-oss/env-nextjs";

export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here.
   */
  server: {
    CONVEX_DEPLOYMENT: {
      description: "Convex deployment URL",
    },
    CLERK_SECRET_KEY: {
      description: "Clerk secret key for authentication",
      defaultValue: "",
    },
    NODE_ENV: {
      description: "Node environment",
      defaultValue: "development",
    },
  },

  /**
   * Specify your client-side environment variables schema here.
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
      description: "Clerk publishable key",
      defaultValue: "",
    },
    NEXT_PUBLIC_CONVEX_URL: {
      description: "Convex URL for client",
      defaultValue: "",
    },
  },

  /**
   * Expose environment variables to the client, by default they're not exposed.
   */
  runtimeEnv: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: true,
    NEXT_PUBLIC_CONVEX_URL: true,
  },

  /**
   * Shared environment variables between client and server.
   */
  shared: {
    SKIP_ENV_VALIDATION: {
      description: "Skip environment validation",
      defaultValue: "false",
    },
  },
});