// Lightweight runtime-safe schema types used by `storage.ts`.
// Removed runtime dependencies on Drizzle/Zod so the backend can run
// in serverless environments without pulling DB libraries.

export type InsertUser = {
  username: string;
  password: string;
};

export type User = InsertUser & {
  id: string;
};
