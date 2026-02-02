import { z } from 'zod';

export const waterConditionsEnum = z.enum(['clear', 'murky', 'stained', 'muddy']);
export const weatherEnum = z.enum(['sunny', 'cloudy', 'overcast', 'rainy', 'stormy']);

export const fishingTripSchema = z.object({
  id: z.string().uuid(),
  date: z.coerce.date(),
  locationName: z.string().min(1).max(255),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  waterConditions: waterConditionsEnum.nullable(),
  weather: weatherEnum.nullable(),
  notes: z.string().nullable(),
  catchCount: z.coerce.number().int().min(0).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const newFishingTripSchema = fishingTripSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateFishingTripSchema = newFishingTripSchema.partial();

export type FishingTrip = z.infer<typeof fishingTripSchema>;
export type NewFishingTrip = z.infer<typeof newFishingTripSchema>;
export type UpdateFishingTrip = z.infer<typeof updateFishingTripSchema>;
export type WaterConditions = z.infer<typeof waterConditionsEnum>;
export type Weather = z.infer<typeof weatherEnum>;

// Trip Event (catch, hooked, miss)
export const eventTypeEnum = z.enum(['catch', 'hooked', 'miss']);

export const tripEventSchema = z.object({
  id: z.string().uuid(),
  tripId: z.string().uuid(),
  eventType: eventTypeEnum,
  species: z.string().max(100).nullable(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  timestamp: z.coerce.date(),
  notes: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const newTripEventSchema = tripEventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateTripEventSchema = newTripEventSchema.partial().omit({ tripId: true });

export type TripEvent = z.infer<typeof tripEventSchema>;
export type NewTripEvent = z.infer<typeof newTripEventSchema>;
export type UpdateTripEvent = z.infer<typeof updateTripEventSchema>;
export type EventType = z.infer<typeof eventTypeEnum>;
