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
