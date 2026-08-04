import {
  createCallerFactory,
  createTRPCRouter,
  publicProcedure,
} from "~/server/api/trpc";
import { habitsRouter } from "./routers/habits";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 *
 * Catatan: registrasi user ditangani oleh REST route di src/app/api/register/route.ts
 * (konsisten satu sumber kebenaran untuk auth — lihat context.md bagian Auth).
 */
export const appRouter = createTRPCRouter({
  health: publicProcedure.query(() => "ok"),
  habits: habitsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 */
export const createCaller = createCallerFactory(appRouter);