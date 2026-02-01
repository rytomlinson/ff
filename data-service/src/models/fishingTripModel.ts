import { query, queryOne } from '@ff/common';
import {
  fishingTripSchema,
  type FishingTrip,
  type NewFishingTrip,
  type UpdateFishingTrip,
} from '@ff/common/schemas/fishingTripSchema.js';
import { throwDbError, mapRowToCamelCase } from '@ff/common/utils/dbUtils.js';

interface FishingTripRow {
  [key: string]: unknown;
  id: string;
  date: Date;
  location_name: string;
  latitude: number;
  longitude: number;
  water_conditions: string | null;
  weather: string | null;
  notes: string | null;
  catch_count: number | null;
  created_at: Date;
  updated_at: Date;
}

function rowMapper(row: FishingTripRow): FishingTrip {
  const camelCaseRow = mapRowToCamelCase<{
    id: string;
    date: Date;
    locationName: string;
    latitude: number;
    longitude: number;
    waterConditions: string | null;
    weather: string | null;
    notes: string | null;
    catchCount: number | null;
    createdAt: Date;
    updatedAt: Date;
  }>(row);
  return fishingTripSchema.parse(camelCaseRow);
}

export async function findAll(): Promise<FishingTrip[]> {
  try {
    const rows = await query<FishingTripRow>(`
      SELECT id, date, location_name, latitude, longitude, water_conditions, weather, notes, catch_count, created_at, updated_at
      FROM fishing_trips
      ORDER BY date DESC, created_at DESC
    `);
    return rows.map(rowMapper);
  } catch (e) {
    return throwDbError(e);
  }
}

export async function findById(id: string): Promise<FishingTrip | null> {
  try {
    const row = await queryOne<FishingTripRow>(
      `
      SELECT id, date, location_name, latitude, longitude, water_conditions, weather, notes, catch_count, created_at, updated_at
      FROM fishing_trips
      WHERE id = :id
    `,
      { id }
    );
    return row ? rowMapper(row) : null;
  } catch (e) {
    return throwDbError(e);
  }
}

export async function create(data: NewFishingTrip): Promise<FishingTrip> {
  try {
    const row = await queryOne<FishingTripRow>(
      `
      INSERT INTO fishing_trips (date, location_name, latitude, longitude, water_conditions, weather, notes, catch_count)
      VALUES (:date, :locationName, :latitude, :longitude, :waterConditions, :weather, :notes, :catchCount)
      RETURNING id, date, location_name, latitude, longitude, water_conditions, weather, notes, catch_count, created_at, updated_at
    `,
      data
    );
    if (!row) {
      throw new Error('Failed to create fishing trip');
    }
    return rowMapper(row);
  } catch (e) {
    return throwDbError(e);
  }
}

export async function update(id: string, data: UpdateFishingTrip): Promise<FishingTrip | null> {
  try {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };

    if (data.date !== undefined) {
      setClauses.push('date = :date');
      params['date'] = data.date;
    }
    if (data.locationName !== undefined) {
      setClauses.push('location_name = :locationName');
      params['locationName'] = data.locationName;
    }
    if (data.latitude !== undefined) {
      setClauses.push('latitude = :latitude');
      params['latitude'] = data.latitude;
    }
    if (data.longitude !== undefined) {
      setClauses.push('longitude = :longitude');
      params['longitude'] = data.longitude;
    }
    if (data.waterConditions !== undefined) {
      setClauses.push('water_conditions = :waterConditions');
      params['waterConditions'] = data.waterConditions;
    }
    if (data.weather !== undefined) {
      setClauses.push('weather = :weather');
      params['weather'] = data.weather;
    }
    if (data.notes !== undefined) {
      setClauses.push('notes = :notes');
      params['notes'] = data.notes;
    }
    if (data.catchCount !== undefined) {
      setClauses.push('catch_count = :catchCount');
      params['catchCount'] = data.catchCount;
    }

    if (setClauses.length === 0) {
      return findById(id);
    }

    setClauses.push('updated_at = NOW()');

    const row = await queryOne<FishingTripRow>(
      `
      UPDATE fishing_trips
      SET ${setClauses.join(', ')}
      WHERE id = :id
      RETURNING id, date, location_name, latitude, longitude, water_conditions, weather, notes, catch_count, created_at, updated_at
    `,
      params
    );
    return row ? rowMapper(row) : null;
  } catch (e) {
    return throwDbError(e);
  }
}

export async function remove(id: string): Promise<boolean> {
  try {
    const result = await query<{ id: string }>(
      `
      DELETE FROM fishing_trips
      WHERE id = :id
      RETURNING id
    `,
      { id }
    );
    return result.length > 0;
  } catch (e) {
    return throwDbError(e);
  }
}
