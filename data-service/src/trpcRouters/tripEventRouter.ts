import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { router, publicProcedure } from '../trpc.js';
import { newTripEventSchema, updateTripEventSchema } from '@ff/common/schemas/fishingTripSchema.js';
import * as tripEventService from '../services/tripEventService.js';

export const tripEventRouter = router({
  listByTrip: publicProcedure
    .input(z.object({ tripId: z.string().uuid() }))
    .query(async ({ input }) => {
      return tripEventService.getEventsByTripId(input.tripId);
    }),

  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const event = await tripEventService.getEventById(input.id);
      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trip event not found',
        });
      }
      return event;
    }),

  create: publicProcedure
    .input(newTripEventSchema)
    .mutation(async ({ input }) => {
      return tripEventService.createEvent(input);
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: updateTripEventSchema,
      })
    )
    .mutation(async ({ input }) => {
      const event = await tripEventService.updateEvent(input.id, input.data);
      if (!event) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trip event not found',
        });
      }
      return event;
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const deleted = await tripEventService.deleteEvent(input.id);
      if (!deleted) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Trip event not found',
        });
      }
      return { success: true };
    }),

  counts: publicProcedure
    .input(z.object({ tripId: z.string().uuid() }))
    .query(async ({ input }) => {
      return tripEventService.getEventCounts(input.tripId);
    }),
});
