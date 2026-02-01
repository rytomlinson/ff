import type { NewFishingTrip, FishingTrip, UpdateFishingTrip } from '@ff/common/schemas/fishingTripSchema.js';
import * as fishingTripModel from '../models/fishingTripModel.js';
import { publishFishingTripEvent } from '../rabbit/rabbitClient.js';

export async function getAllFishingTrips(): Promise<FishingTrip[]> {
  return fishingTripModel.findAll();
}

export async function getFishingTripById(id: string): Promise<FishingTrip | null> {
  return fishingTripModel.findById(id);
}

export async function createFishingTrip(data: NewFishingTrip): Promise<FishingTrip> {
  const trip = await fishingTripModel.create(data);
  await publishFishingTripEvent('fishingTrip.created', trip);
  return trip;
}

export async function updateFishingTrip(
  id: string,
  data: UpdateFishingTrip
): Promise<FishingTrip | null> {
  const trip = await fishingTripModel.update(id, data);
  if (trip) {
    await publishFishingTripEvent('fishingTrip.updated', trip);
  }
  return trip;
}

export async function deleteFishingTrip(id: string): Promise<boolean> {
  const deleted = await fishingTripModel.remove(id);
  if (deleted) {
    await publishFishingTripEvent('fishingTrip.deleted', { id });
  }
  return deleted;
}
