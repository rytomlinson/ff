import type { NewTripEvent, TripEvent, UpdateTripEvent } from '@ff/common/schemas/fishingTripSchema.js';
import * as tripEventModel from '../models/tripEventModel.js';

export async function getEventsByTripId(tripId: string): Promise<TripEvent[]> {
  return tripEventModel.findByTripId(tripId);
}

export async function getEventById(id: string): Promise<TripEvent | null> {
  return tripEventModel.findById(id);
}

export async function createEvent(data: NewTripEvent): Promise<TripEvent> {
  return tripEventModel.create(data);
}

export async function updateEvent(
  id: string,
  data: UpdateTripEvent
): Promise<TripEvent | null> {
  return tripEventModel.update(id, data);
}

export async function deleteEvent(id: string): Promise<boolean> {
  return tripEventModel.remove(id);
}

export async function getEventCounts(tripId: string): Promise<{ catches: number; hooked: number; misses: number }> {
  return tripEventModel.countByTripId(tripId);
}
