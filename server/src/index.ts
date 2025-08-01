
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schema types
import {
  createUserInputSchema,
  updateUserInputSchema,
  createAstrologyReadingInputSchema,
  uploadImageInputSchema,
  getUserReadingsInputSchema,
  getReadingByIdInputSchema,
  getTranslationsInputSchema,
  createTranslationInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { updateUser } from './handlers/update_user';
import { getUser } from './handlers/get_user';
import { uploadPalmImage } from './handlers/upload_palm_image';
import { createAstrologyReading } from './handlers/create_astrology_reading';
import { getUserPalmReadings } from './handlers/get_user_palm_readings';
import { getUserAstrologyReadings } from './handlers/get_user_astrology_readings';
import { getPalmReadingById } from './handlers/get_palm_reading_by_id';
import { getAstrologyReadingById } from './handlers/get_astrology_reading_by_id';
import { getTranslations } from './handlers/get_translations';
import { createTranslation } from './handlers/create_translation';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),

  updateUser: publicProcedure
    .input(updateUserInputSchema)
    .mutation(({ input }) => updateUser(input)),

  getUser: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(({ input }) => getUser(input.userId)),

  // Palm reading
  uploadPalmImage: publicProcedure
    .input(uploadImageInputSchema)
    .mutation(({ input }) => uploadPalmImage(input)),

  getUserPalmReadings: publicProcedure
    .input(getUserReadingsInputSchema)
    .query(({ input }) => getUserPalmReadings(input)),

  getPalmReadingById: publicProcedure
    .input(getReadingByIdInputSchema)
    .query(({ input }) => getPalmReadingById(input)),

  // Astrology reading
  createAstrologyReading: publicProcedure
    .input(createAstrologyReadingInputSchema)
    .mutation(({ input }) => createAstrologyReading(input)),

  getUserAstrologyReadings: publicProcedure
    .input(getUserReadingsInputSchema)
    .query(({ input }) => getUserAstrologyReadings(input)),

  getAstrologyReadingById: publicProcedure
    .input(getReadingByIdInputSchema)
    .query(({ input }) => getAstrologyReadingById(input)),

  // Translations
  getTranslations: publicProcedure
    .input(getTranslationsInputSchema)
    .query(({ input }) => getTranslations(input)),

  createTranslation: publicProcedure
    .input(createTranslationInputSchema)
    .mutation(({ input }) => createTranslation(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Multi-language Astrology & Palmistry TRPC server listening at port: ${port}`);
}

start();
