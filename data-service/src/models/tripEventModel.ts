import { query, queryOne } from '@ff/common';
import {
  tripEventSchema,
  type TripEvent,
  type NewTripEvent,
  type UpdateTripEvent,
} from '@ff/common/schemas/fishingTripSchema.js';
import { throwDbError, mapRowToCamelCase } from '@ff/common/utils/dbUtils.js';

interface TripEventRow {
  [key: string]: unknown;
  id: string;
  trip_id: string;
  event_type: string;
  species: string | null;
  latitude: number;
  longitude: number;
  timestamp: Date;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function rowMapper(row: TripEventRow): TripEvent {
  const camelCaseRow = mapRowToCamelCase<{
    id: string;
    tripId: string;
    eventType: string;
    species: string | null;
    latitude: number;
    longitude: number;
    timestamp: Date;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>(row);
  return tripEventSchema.parse(camelCaseRow);
}

export async function findByTripId(tripId: string): Promise<TripEvent[]> {
  try {
    const rows = await query<TripEventRow>(`
      SELECT id, trip_id, event_type, species, latitude, longitude, timestamp, notes, created_at, updated_at
      FROM trip_events
      WHERE trip_id = :tripId
      ORDER BY timestamp ASC
    `, { tripId });
    return rows.map(rowMapper);
  } catch (e) {
    return throwDbError(e);
  }
}

export async function findById(id: string): Promise<TripEvent | null> {
  try {
    const row = await queryOne<TripEventRow>(
      `
      SELECT id, trip_id, event_type, species, latitude, longitude, timestamp, notes, created_at, updated_at
      FROM trip_events
      WHERE id = :id
    `,
      { id }
    );
    return row ? rowMapper(row) : null;
  } catch (e) {
    return throwDbError(e);
  }
}

export async function create(data: NewTripEvent): Promise<TripEvent> {
  try {
    const row = await queryOne<TripEventRow>(
      `
      INSERT INTO trip_events (trip_id, event_type, species, latitude, longitude, timestamp, notes)
      VALUES (:tripId, :eventType, :species, :latitude, :longitude, :timestamp, :notes)
      RETURNING id, trip_id, event_type, species, latitude, longitude, timestamp, notes, created_at, updated_at
    `,
      data
    );
    if (!row) {
      throw new Error('Failed to create trip event');
    }
    return rowMapper(row);
  } catch (e) {
    return throwDbError(e);
  }
}

export async function update(id: string, data: UpdateTripEvent): Promise<TripEvent | null> {
  try {
    const setClauses: string[] = [];
    const params: Record<string, unknown> = { id };

    if (data.eventType !== undefined) {
      setClauses.push('event_type = :eventType');
      params['eventType'] = data.eventType;
    }
    if (data.species !== undefined) {
      setClauses.push('species = :species');
      params['species'] = data.species;
    }
    if (data.latitude !== undefined) {
      setClauses.push('latitude = :latitude');
      params['latitude'] = data.latitude;
    }
    if (data.longitude !== undefined) {
      setClauses.push('longitude = :longitude');
      params['longitude'] = data.longitude;
    }
    if (data.timestamp !== undefined) {
      setClauses.push('timestamp = :timestamp');
      params['timestamp'] = data.timestamp;
    }
    if (data.notes !== undefined) {
      setClauses.push('notes = :notes');
      params['notes'] = data.notes;
    }

    if (setClauses.length === 0) {
      return findById(id);
    }

    setClauses.push('updated_at = NOW()');

    const row = await queryOne<TripEventRow>(
      `
      UPDATE trip_events
      SET ${setClauses.join(', ')}
      WHERE id = :id
      RETURNING id, trip_id, event_type, species, latitude, longitude, timestamp, notes, created_at, updated_at
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
      DELETE FROM trip_events
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

export async function countByTripId(tripId: string): Promise<{ catches: number; hooked: number; misses: number }> {
  try {
    const rows = await query<{ event_type: string; count: string }>(
      `
      SELECT event_type, COUNT(*) as count
      FROM trip_events
      WHERE trip_id = :tripId
      GROUP BY event_type
    `,
      { tripId }
    );

    const counts = { catches: 0, hooked: 0, misses: 0 };
    for (const row of rows) {
      if (row.event_type === 'catch') counts.catches = parseInt(row.count, 10);
      if (row.event_type === 'hooked') counts.hooked = parseInt(row.count, 10);
      if (row.event_type === 'miss') counts.misses = parseInt(row.count, 10);
    }
    return counts;
  } catch (e) {
    return throwDbError(e);
  }
}
