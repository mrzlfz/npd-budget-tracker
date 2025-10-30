// Temporary placeholder for Convex generated server types
import type { DataModel } from '../schema';

export type ActionCtx = any; // Placeholder for Convex action context
export type MutationCtx = any; // Placeholder for Convex mutation context
export type QueryCtx = any; // Placeholder for Convex query context

export const mutation = <T, Args extends any[]>(name: string, ...args: Args) => Promise<T>;
export const query = <T, Args extends any[]>(name: string, ...args: Args) => Promise<T>;
export const action = <T, Args extends any[]>(name: string, ...args: Args) => Promise<T>;

export const api = {
  mutation,
  query,
  action,
};

// Export all schema types
export type {
  Organization,
  User,
  RKADocument,
  RKASubkegiatan,
  RKAKegiatan,
  RKAProgram,
  RKAAccount,
  NPDDocument,
  NPDLine,
  SP2DRef,
  Realization,
  PerformanceLog,
  Attachment,
  NPDFile,
  AuditLog,
  ActivityLog,
  BudgetItem,
  File,
} = DataModel;
