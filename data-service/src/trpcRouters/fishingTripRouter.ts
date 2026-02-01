import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc.js';
import { newFishingTripSchema, updateFishingTripSchema } from '@ff/common/schemas/fishingTripSchema.js';
import * as fishingTripService from '../services/fishingTripService.js';

export const fishingTripRouter = router({
  list: publicProcedure.query(async () => {
    return fishingTripService.getAllFishingTrips();
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const trip = await fishingTripService.getFishingTripById(input.id);
      if (!trip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fishing trip not found',
        });
      }
      return trip;
    }),

  create: publicProcedure
    .input(newFishingTripSchema)
    .mutation(async ({ input }) => {
      return fishingTripService.createFishingTrip(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateFishingTripSchema,
      })
    )
    .mutation(async ({ input }) => {
      const trip = await fishingTripService.updateFishingTrip(input.id, input.data);
      if (!trip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fishing trip not found',
        });
      }
      return trip;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const deleted = await fishingTripService.deleteFishingTrip(input.id);
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fishing trip not found',
        });
      }
      return { success: true };
    }),
});
